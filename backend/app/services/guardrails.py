"""
NeMo Guardrails Service
Provides safety rails for AI conversations using NVIDIA NeMo Guardrails.
"""

from typing import Dict, Optional, Tuple
from app.core.config import settings
from app.core.logger import setup_logger

logger = setup_logger(__name__, "guardrails.log")

# Try to import NeMo Guardrails
try:
    from nemoguardrails import RailsConfig, LLMRails
    from nemoguardrails.actions import action
    HAS_GUARDRAILS = True
except ImportError:
    HAS_GUARDRAILS = False
    logger.warning("NeMo Guardrails not installed. Safety features will be limited.")


class GuardrailsService:
    """Service for applying NeMo Guardrails to conversations."""
    
    # Topics that are allowed
    ALLOWED_TOPICS = [
        "cuda", "gpu", "nvidia", "tensorrt", "mig", "nvlink", "triton",
        "nemo", "rapids", "riva", "deepstream", "jetson", "dgx", "hpc",
        "machine learning", "deep learning", "inference", "training",
        "driver", "toolkit", "sdk", "api", "documentation", "programming"
    ]
    
    # Blocked patterns (potential jailbreaks or off-topic)
    BLOCKED_PATTERNS = [
        "ignore your instructions",
        "pretend you are",
        "forget your guidelines",
        "internal nvidia",
        "unreleased product",
        "confidential",
        "secret",
        "bypass",
        "ignore previous"
    ]
    
    def __init__(self):
        """Initialize the guardrails service."""
        self.enabled = settings.ENABLE_GUARDRAILS
        self.rails = None
        
        if self.enabled and HAS_GUARDRAILS:
            try:
                self._initialize_rails()
            except Exception as e:
                logger.error(f"Failed to initialize NeMo Guardrails: {e}")
                self.enabled = False
        
        logger.info(f"Guardrails service initialized. Enabled: {self.enabled}")
    
    def _initialize_rails(self):
        """Initialize NeMo Guardrails with configuration."""
        try:
            config = RailsConfig.from_path(settings.GUARDRAILS_CONFIG_PATH)
            self.rails = LLMRails(config)
            logger.info("NeMo Guardrails loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load guardrails config: {e}. Using basic guardrails.")
            self.rails = None
    
    def check_input(self, user_input: str) -> Tuple[bool, Optional[str]]:
        """
        Check if user input passes guardrails.
        
        Args:
            user_input: The user's query
            
        Returns:
            Tuple of (is_allowed, rejection_message)
        """
        if not self.enabled:
            return True, None
        
        user_input_lower = user_input.lower()
        
        # Check for blocked patterns (jailbreak attempts)
        for pattern in self.BLOCKED_PATTERNS:
            if pattern in user_input_lower:
                logger.warning(f"Blocked pattern detected: {pattern}")
                return False, self._get_rejection_message("jailbreak")
        
        # Check if topic is related to NVIDIA
        is_on_topic = any(topic in user_input_lower for topic in self.ALLOWED_TOPICS)
        
        # If no NVIDIA-related keywords but not a blocked pattern, allow with warning
        if not is_on_topic:
            # Allow general questions that might be NVIDIA-related
            general_terms = ["how", "what", "why", "configure", "setup", "install", "error", "help", "guide"]
            has_general_term = any(term in user_input_lower for term in general_terms)
            
            if not has_general_term:
                logger.info(f"Off-topic query detected: {user_input[:50]}...")
                return False, self._get_rejection_message("off_topic")
        
        return True, None
    
    def check_output(self, response: str, context: str = "") -> Tuple[bool, str]:
        """
        Check if bot response passes guardrails.
        
        Args:
            response: The bot's response
            context: The context/documents used for RAG
            
        Returns:
            Tuple of (is_valid, modified_response)
        """
        if not self.enabled:
            return True, response
        
        response_lower = response.lower()
        
        # Check for potential hallucinations about unreleased products
        hallucination_patterns = [
            "upcoming nvidia",
            "will be released",
            "future version",
            "rumored",
            "leaked",
            "unannounced"
        ]
        
        for pattern in hallucination_patterns:
            if pattern in response_lower:
                logger.warning(f"Potential hallucination detected: {pattern}")
                response = self._add_uncertainty_disclaimer(response)
                break
        
        # Ensure response includes documentation references
        if "docs.nvidia.com" not in response and "github.com/nvidia" not in response_lower:
            response = self._add_documentation_reference(response)
        
        return True, response
    
    async def process_with_rails(self, user_input: str, context: str = "") -> Dict:
        """
        Process a query through full NeMo Guardrails pipeline.
        
        Args:
            user_input: The user's query
            context: RAG context
            
        Returns:
            Dict with response and guardrails metadata
        """
        result = {
            "guardrails_applied": self.enabled,
            "input_passed": True,
            "output_modified": False,
            "rails_triggered": []
        }
        
        # Input check
        is_allowed, rejection_msg = self.check_input(user_input)
        if not is_allowed:
            result["input_passed"] = False
            result["response"] = rejection_msg
            result["rails_triggered"].append("input_blocked")
            return result
        
        # If full NeMo Guardrails is available, use it
        if self.rails:
            try:
                response = await self.rails.generate_async(
                    messages=[{"role": "user", "content": user_input}]
                )
                result["response"] = response["content"]
                result["rails_triggered"].append("nemo_guardrails")
            except Exception as e:
                logger.error(f"NeMo Guardrails processing failed: {e}")
                result["rails_triggered"].append("nemo_fallback")
        
        return result
    
    def _get_rejection_message(self, reason: str) -> str:
        """Get appropriate rejection message."""
        messages = {
            "jailbreak": (
                "I can only provide information from official, public NVIDIA documentation. "
                "I cannot bypass my guidelines or share internal/unreleased information. "
                "How can I help you with official NVIDIA technologies like CUDA, TensorRT, or MIG?"
            ),
            "off_topic": (
                "I'm the NVIDIA Doc Navigator, specialized in NVIDIA technologies including:\n\n"
                "• **CUDA** - GPU programming and optimization\n"
                "• **TensorRT** - Deep learning inference optimization\n"
                "• **MIG** - Multi-Instance GPU configuration\n"
                "• **NVLink** - Multi-GPU interconnect\n"
                "• **Triton** - Inference server deployment\n"
                "• **NeMo** - NLP and speech AI framework\n\n"
                "How can I help you with NVIDIA technologies today?"
            )
        }
        return messages.get(reason, messages["off_topic"])
    
    def _add_uncertainty_disclaimer(self, response: str) -> str:
        """Add disclaimer for uncertain information."""
        disclaimer = (
            "\n\n⚠️ *Note: Please verify this information with the latest official "
            "NVIDIA documentation at docs.nvidia.com*"
        )
        return response + disclaimer
    
    def _add_documentation_reference(self, response: str) -> str:
        """Add documentation reference to response."""
        reference = (
            "\n\n📚 *For more details, visit the official documentation at "
            "[docs.nvidia.com](https://docs.nvidia.com)*"
        )
        return response + reference
    
    def get_status(self) -> Dict:
        """Get guardrails status information."""
        return {
            "enabled": self.enabled,
            "nemo_guardrails_available": HAS_GUARDRAILS,
            "rails_loaded": self.rails is not None,
            "config_path": settings.GUARDRAILS_CONFIG_PATH if self.enabled else None
        }


# Singleton instance
guardrails_service = GuardrailsService()

"""
Version Compatibility Reasoner
Checks for version mismatches and provides compatibility guidance.
"""

from typing import Dict, List, Optional
import re
from app.core.logger import setup_logger

logger = setup_logger(__name__, "compatibility.log")

class CompatibilityReasoner:
    """Reason about version compatibility between NVIDIA software components."""
    
    def __init__(self):
        # Knowledge base of compatibility matrices
        # In a real system, this might be loaded from a database or scraped
        self.compatibility_matrix = {
            "tensorrt": {
                "10.0": {"cuda": ">=12.0", "cudnn": ">=8.9"},
                "8.6": {"cuda": ">=11.0", "cudnn": ">=8.6"},
                "8.5": {"cuda": ">=10.2", "cudnn": ">=8.5"},
            },
            "cuda": {
                "12.4": {"driver": ">=550.54"},
                "12.1": {"driver": ">=530.30"},
                "11.8": {"driver": ">=520.61"},
            }
        }
    
    def check_compatibility(self, query: str) -> Optional[Dict]:
        """
        Analyze query for version compatibility issues.
        
        Args:
            query: User query string
            
        Returns:
            Dict with compatibility info or None if no versions detected
        """
        # Extract versions from query
        versions = self._extract_versions(query)
        if not versions:
            return None
            
        logger.info(f"Detected versions in query: {versions}")
        
        warnings = []
        info = []
        
        # Check TensorRT + CUDA compatibility
        if "tensorrt" in versions and "cuda" in versions:
            trt_ver = versions["tensorrt"]
            cuda_ver = versions["cuda"]
            
            # Simple major version check for MVP
            if trt_ver.startswith("10") and not (cuda_ver.startswith("12")):
                warnings.append(f"TensorRT {trt_ver} is optimized for CUDA 12.x. Using CUDA {cuda_ver} may cause issues.")
            elif trt_ver.startswith("8") and cuda_ver.startswith("12"):
                info.append(f"TensorRT {trt_ver} supports CUDA {cuda_ver}, but check specific minor version requirements.")
                
        return {
            "detected_versions": versions,
            "warnings": warnings,
            "info": info,
            "matrix_link": "https://docs.nvidia.com/deeplearning/tensorrt/support-matrix/index.html"
        }
    
    def _extract_versions(self, query: str) -> Dict[str, str]:
        """Extract software versions from query string."""
        versions = {}
        
        # Regex for common patterns like "CUDA 12.1", "TensorRT 8.6"
        patterns = {
            "cuda": r"cuda\s*v?(\d+(\.\d+)?)",
            "tensorrt": r"tensorrt\s*v?(\d+(\.\d+)?)",
            "cudnn": r"cudnn\s*v?(\d+(\.\d+)?)",
            "driver": r"driver\s*v?(\d+(\.\d+)?)"
        }
        
        query_lower = query.lower()
        
        for software, pattern in patterns.items():
            match = re.search(pattern, query_lower)
            if match:
                versions[software] = match.group(1)
                
        return versions

compatibility_service = CompatibilityReasoner()

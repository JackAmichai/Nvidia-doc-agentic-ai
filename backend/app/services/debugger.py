"""
Step-by-Step Debugger
Generates interactive debugging flows for common issues.
"""

from typing import List, Dict, Optional
from enum import Enum
from app.core.logger import setup_logger

logger = setup_logger(__name__, "debugger.log")

class DebugFlow(Enum):
    MIG_CONFIG = "mig_config"
    NVLINK_STATUS = "nvlink_status"
    CUDA_OOM = "cuda_oom"
    KERNEL_LAUNCH = "kernel_launch"

class DebuggerService:
    """Provides step-by-step debugging workflows."""
    
    def __init__(self):
        self.flows = {
            DebugFlow.MIG_CONFIG: {
                "title": "MIG Configuration Debugger",
                "steps": [
                    {
                        "id": 1,
                        "action": "Check if MIG is enabled on the GPU",
                        "command": "nvidia-smi -i <gpu_id> --query-gpu=mig.mode.current --format=csv,noheader",
                        "expected": "Enabled",
                        "fix": "Run `sudo nvidia-smi -i <gpu_id> -mig 1` (Requires root & GPU reset)"
                    },
                    {
                        "id": 2,
                        "action": "List available MIG profiles",
                        "command": "nvidia-smi mig -lgip",
                        "expected": "List of profiles (e.g., 1g.5gb, 2g.10gb)",
                        "fix": "Ensure GPU supports MIG (A100, H100) and driver is up to date"
                    },
                    {
                        "id": 3,
                        "action": "Create a MIG instance",
                        "command": "sudo nvidia-smi mig -cgi <profile_id> -C",
                        "expected": "MIG instance created successfully",
                        "fix": "Check for existing instances consuming resources"
                    }
                ]
            },
            DebugFlow.CUDA_OOM: {
                "title": "CUDA Out of Memory (OOM) Debugger",
                "steps": [
                    {
                        "id": 1,
                        "action": "Check current GPU memory usage",
                        "command": "nvidia-smi",
                        "expected": "Available memory > Required memory",
                        "fix": "Kill zombie processes using `kill -9 <pid>`"
                    },
                    {
                        "id": 2,
                        "action": "Analyze memory fragmentation",
                        "command": "Use `torch.cuda.memory_summary()` (PyTorch) or Nsight Systems",
                        "expected": "Low fragmentation",
                        "fix": "Use `torch.cuda.empty_cache()` or adjust batch size"
                    }
                ]
            }
        }
    
    def get_debug_flow(self, query: str) -> Optional[Dict]:
        """
        Identify applicable debug flow based on query.
        """
        query_lower = query.lower()
        
        if "mig" in query_lower and ("config" in query_lower or "enable" in query_lower or "error" in query_lower):
            return self.flows[DebugFlow.MIG_CONFIG]
        elif "out of memory" in query_lower or "oom" in query_lower:
            return self.flows[DebugFlow.CUDA_OOM]
        
        return None

debugger_service = DebuggerService()

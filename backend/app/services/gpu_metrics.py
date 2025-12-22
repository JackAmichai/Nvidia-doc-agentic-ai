"""
GPU Metrics Service
Provides real-time GPU monitoring using NVIDIA NVML (pynvml).
"""

from typing import Dict, List, Optional
from app.core.logger import setup_logger

logger = setup_logger(__name__, "gpu_metrics.log")

# Try to import pynvml
try:
    import pynvml
    HAS_PYNVML = True
except ImportError:
    HAS_PYNVML = False
    logger.warning("pynvml not installed. GPU metrics will not be available.")


class GPUMetricsService:
    """Service for monitoring NVIDIA GPU metrics."""
    
    def __init__(self):
        """Initialize the GPU metrics service."""
        self.initialized = False
        self.gpu_count = 0
        
        if HAS_PYNVML:
            try:
                pynvml.nvmlInit()
                self.gpu_count = pynvml.nvmlDeviceGetCount()
                self.initialized = True
                logger.info(f"NVML initialized. Found {self.gpu_count} GPU(s)")
            except Exception as e:
                logger.warning(f"Failed to initialize NVML: {e}")
    
    def __del__(self):
        """Cleanup NVML on destruction."""
        if self.initialized and HAS_PYNVML:
            try:
                pynvml.nvmlShutdown()
            except:
                pass
    
    def get_all_gpu_info(self) -> Dict:
        """
        Get comprehensive information about all GPUs.
        
        Returns:
            Dict with GPU information and metrics
        """
        if not self.initialized:
            return self._get_mock_gpu_info()
        
        try:
            gpus = []
            for i in range(self.gpu_count):
                handle = pynvml.nvmlDeviceGetHandleByIndex(i)
                gpu_info = self._get_gpu_details(handle, i)
                gpus.append(gpu_info)
            
            return {
                "available": True,
                "driver_version": pynvml.nvmlSystemGetDriverVersion(),
                "nvml_version": pynvml.nvmlSystemGetNVMLVersion(),
                "gpu_count": self.gpu_count,
                "gpus": gpus,
                "timestamp": self._get_timestamp()
            }
        except Exception as e:
            logger.error(f"Error getting GPU info: {e}")
            return self._get_mock_gpu_info()
    
    def _get_gpu_details(self, handle, index: int) -> Dict:
        """Get detailed information for a single GPU."""
        try:
            # Basic info
            name = pynvml.nvmlDeviceGetName(handle)
            if isinstance(name, bytes):
                name = name.decode('utf-8')
            
            uuid = pynvml.nvmlDeviceGetUUID(handle)
            if isinstance(uuid, bytes):
                uuid = uuid.decode('utf-8')
            
            # Memory info
            memory = pynvml.nvmlDeviceGetMemoryInfo(handle)
            memory_total_gb = round(memory.total / (1024**3), 2)
            memory_used_gb = round(memory.used / (1024**3), 2)
            memory_free_gb = round(memory.free / (1024**3), 2)
            memory_utilization = round((memory.used / memory.total) * 100, 1)
            
            # Utilization
            utilization = pynvml.nvmlDeviceGetUtilizationRates(handle)
            
            # Temperature
            temperature = pynvml.nvmlDeviceGetTemperature(handle, pynvml.NVML_TEMPERATURE_GPU)
            
            # Power
            try:
                power_draw = pynvml.nvmlDeviceGetPowerUsage(handle) / 1000  # Convert to Watts
                power_limit = pynvml.nvmlDeviceGetPowerManagementLimit(handle) / 1000
            except:
                power_draw = 0
                power_limit = 0
            
            # Clock speeds
            try:
                graphics_clock = pynvml.nvmlDeviceGetClockInfo(handle, pynvml.NVML_CLOCK_GRAPHICS)
                memory_clock = pynvml.nvmlDeviceGetClockInfo(handle, pynvml.NVML_CLOCK_MEM)
            except:
                graphics_clock = 0
                memory_clock = 0
            
            # MIG mode
            mig_info = self._get_mig_info(handle)
            
            # PCIe info
            try:
                pcie_gen = pynvml.nvmlDeviceGetCurrPcieLinkGeneration(handle)
                pcie_width = pynvml.nvmlDeviceGetCurrPcieLinkWidth(handle)
            except:
                pcie_gen = 0
                pcie_width = 0
            
            return {
                "index": index,
                "name": name,
                "uuid": uuid,
                "memory": {
                    "total_gb": memory_total_gb,
                    "used_gb": memory_used_gb,
                    "free_gb": memory_free_gb,
                    "utilization_percent": memory_utilization
                },
                "utilization": {
                    "gpu_percent": utilization.gpu,
                    "memory_percent": utilization.memory
                },
                "temperature_c": temperature,
                "power": {
                    "draw_watts": round(power_draw, 1),
                    "limit_watts": round(power_limit, 1)
                },
                "clocks": {
                    "graphics_mhz": graphics_clock,
                    "memory_mhz": memory_clock
                },
                "pcie": {
                    "generation": pcie_gen,
                    "width": pcie_width
                },
                "mig": mig_info
            }
        except Exception as e:
            logger.error(f"Error getting GPU {index} details: {e}")
            return {"index": index, "error": str(e)}
    
    def _get_mig_info(self, handle) -> Dict:
        """Get MIG (Multi-Instance GPU) information."""
        try:
            # Check if MIG mode is enabled
            current_mode, pending_mode = pynvml.nvmlDeviceGetMigMode(handle)
            
            if current_mode == pynvml.NVML_DEVICE_MIG_ENABLE:
                # Get MIG device count
                try:
                    mig_count = pynvml.nvmlDeviceGetMaxMigDeviceCount(handle)
                    
                    # Get MIG instances
                    instances = []
                    for i in range(mig_count):
                        try:
                            mig_handle = pynvml.nvmlDeviceGetMigDeviceHandleByIndex(handle, i)
                            mig_info = {
                                "index": i,
                                "name": pynvml.nvmlDeviceGetName(mig_handle)
                            }
                            instances.append(mig_info)
                        except:
                            pass
                    
                    return {
                        "enabled": True,
                        "mode": "enabled",
                        "max_instances": mig_count,
                        "instances": instances
                    }
                except:
                    return {"enabled": True, "mode": "enabled", "instances": []}
            else:
                return {
                    "enabled": False,
                    "mode": "disabled",
                    "pending_mode": "enabled" if pending_mode == pynvml.NVML_DEVICE_MIG_ENABLE else "disabled"
                }
        except pynvml.NVMLError_NotSupported:
            return {"enabled": False, "mode": "not_supported"}
        except Exception as e:
            return {"enabled": False, "mode": "error", "error": str(e)}
    
    def _get_mock_gpu_info(self) -> Dict:
        """Return mock GPU info when NVML is not available."""
        return {
            "available": False,
            "message": "GPU monitoring not available. NVML not initialized.",
            "mock_data": True,
            "gpu_count": 1,
            "gpus": [{
                "index": 0,
                "name": "NVIDIA A100-SXM4-80GB (Demo)",
                "uuid": "GPU-demo-uuid-0000",
                "memory": {
                    "total_gb": 80.0,
                    "used_gb": 12.5,
                    "free_gb": 67.5,
                    "utilization_percent": 15.6
                },
                "utilization": {
                    "gpu_percent": 23,
                    "memory_percent": 16
                },
                "temperature_c": 42,
                "power": {
                    "draw_watts": 125.0,
                    "limit_watts": 400.0
                },
                "clocks": {
                    "graphics_mhz": 1410,
                    "memory_mhz": 1593
                },
                "pcie": {
                    "generation": 4,
                    "width": 16
                },
                "mig": {
                    "enabled": True,
                    "mode": "enabled",
                    "max_instances": 7,
                    "instances": [
                        {"index": 0, "name": "MIG 1g.10gb"},
                        {"index": 1, "name": "MIG 1g.10gb"},
                        {"index": 2, "name": "MIG 3g.40gb"}
                    ]
                }
            }],
            "timestamp": self._get_timestamp()
        }
    
    def _get_timestamp(self) -> str:
        """Get current timestamp."""
        from datetime import datetime
        return datetime.utcnow().isoformat() + "Z"
    
    def get_gpu_summary(self) -> Dict:
        """Get a quick summary of GPU status."""
        info = self.get_all_gpu_info()
        
        if not info.get("gpus"):
            return {"status": "no_gpus", "message": "No GPUs detected"}
        
        total_memory = sum(g.get("memory", {}).get("total_gb", 0) for g in info["gpus"])
        used_memory = sum(g.get("memory", {}).get("used_gb", 0) for g in info["gpus"])
        avg_utilization = sum(g.get("utilization", {}).get("gpu_percent", 0) for g in info["gpus"]) / len(info["gpus"])
        avg_temp = sum(g.get("temperature_c", 0) for g in info["gpus"]) / len(info["gpus"])
        
        return {
            "status": "healthy" if avg_temp < 80 else "warning",
            "gpu_count": info["gpu_count"],
            "total_memory_gb": round(total_memory, 1),
            "used_memory_gb": round(used_memory, 1),
            "avg_utilization_percent": round(avg_utilization, 1),
            "avg_temperature_c": round(avg_temp, 1),
            "mock_data": info.get("mock_data", False)
        }


# Singleton instance
gpu_metrics_service = GPUMetricsService()

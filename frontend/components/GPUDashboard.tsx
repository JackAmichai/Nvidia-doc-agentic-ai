'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Cpu, Thermometer, Zap, HardDrive, RefreshCw, Server, AlertTriangle, CheckCircle } from 'lucide-react';

interface GPUMemory {
  total_gb: number;
  used_gb: number;
  free_gb: number;
  utilization_percent: number;
}

interface GPUUtilization {
  gpu_percent: number;
  memory_percent: number;
}

interface GPUPower {
  draw_watts: number;
  limit_watts: number;
}

interface MIGInstance {
  index: number;
  name: string;
}

interface MIGInfo {
  enabled: boolean;
  mode: string;
  max_instances?: number;
  instances?: MIGInstance[];
}

interface GPUInfo {
  index: number;
  name: string;
  uuid: string;
  memory: GPUMemory;
  utilization: GPUUtilization;
  temperature_c: number;
  power: GPUPower;
  mig: MIGInfo;
}

interface GPUData {
  available: boolean;
  driver_version?: string;
  nvml_version?: string;
  gpu_count: number;
  gpus: GPUInfo[];
  mock_data?: boolean;
  timestamp: string;
}

interface GPUDashboardProps {
  onShowTechPopup?: (tech: string) => void;
}

export default function GPUDashboard({ onShowTechPopup }: GPUDashboardProps) {
  const [gpuData, setGpuData] = useState<GPUData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  // Use ref to track if component is mounted (prevents memory leaks)
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchGPUData = useCallback(async () => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/v1/gpu-info`, {
        signal: abortControllerRef.current.signal,
      });
      if (!response.ok) throw new Error('Failed to fetch GPU data');
      const data = await response.json();
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setGpuData(data);
        setError(null);
      }
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      if (isMountedRef.current) {
        setError('Could not connect to GPU metrics service');
        // Set mock data for demo
        setGpuData({
          available: false,
          mock_data: true,
          gpu_count: 1,
          gpus: [{
            index: 0,
            name: "NVIDIA A100-SXM4-80GB (Demo)",
            uuid: "GPU-demo-0000",
            memory: { total_gb: 80, used_gb: 12.5, free_gb: 67.5, utilization_percent: 15.6 },
            utilization: { gpu_percent: 23, memory_percent: 16 },
            temperature_c: 42,
            power: { draw_watts: 125, limit_watts: 400 },
            mig: { enabled: true, mode: "enabled", max_instances: 7, instances: [
              { index: 0, name: "MIG 1g.10gb" },
              { index: 1, name: "MIG 1g.10gb" },
              { index: 2, name: "MIG 3g.40gb" }
            ]}
          }],
          timestamp: new Date().toISOString()
        });
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Initial fetch and cleanup
  useEffect(() => {
    isMountedRef.current = true;
    fetchGPUData();
    
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchGPUData]);
  
  // Auto-refresh effect (separate to avoid dependency issues)
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (autoRefresh) {
      intervalId = setInterval(fetchGPUData, 5000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, fetchGPUData]);

  const getTemperatureColor = (temp: number) => {
    if (temp < 50) return 'text-green-400';
    if (temp < 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getUtilizationColor = (util: number) => {
    if (util < 30) return 'bg-green-500';
    if (util < 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="bg-white/5 rounded-2xl border border-white/10 p-6 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
        <div className="h-32 bg-white/10 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Cpu className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">GPU Metrics</h3>
            <p className="text-xs text-gray-400">
              {gpuData?.mock_data ? 'Demo Data' : 'Real-time monitoring via NVML'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onShowTechPopup?.('pynvml')}
            className="px-2 py-1 text-xs bg-gray-500/20 hover:bg-gray-500/30 rounded-full text-gray-400 transition-colors"
          >
            NVML
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded-lg transition-colors ${
              autoRefresh ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
            title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* GPU Cards */}
      <div className="p-4 space-y-4">
        {gpuData?.gpus.map((gpu) => (
          <div key={gpu.index} className="bg-black/20 rounded-xl p-4 space-y-4">
            {/* GPU Name & Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-green-400" />
                <span className="font-medium text-white text-sm">{gpu.name}</span>
              </div>
              {gpu.mig.enabled ? (
                <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-full">
                  MIG Enabled
                </span>
              ) : (
                <span className="px-2 py-0.5 text-xs bg-gray-500/20 text-gray-400 rounded-full">
                  Standard Mode
                </span>
              )}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* GPU Utilization */}
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                  <Cpu className="w-3 h-3" />
                  <span>GPU</span>
                </div>
                <div className="text-2xl font-bold text-white">{gpu.utilization.gpu_percent}%</div>
                <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getUtilizationColor(gpu.utilization.gpu_percent)} transition-all`}
                    style={{ width: `${gpu.utilization.gpu_percent}%` }}
                  />
                </div>
              </div>

              {/* Memory */}
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                  <HardDrive className="w-3 h-3" />
                  <span>Memory</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {gpu.memory.used_gb.toFixed(1)}<span className="text-sm text-gray-400">/{gpu.memory.total_gb}GB</span>
                </div>
                <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getUtilizationColor(gpu.memory.utilization_percent)} transition-all`}
                    style={{ width: `${gpu.memory.utilization_percent}%` }}
                  />
                </div>
              </div>

              {/* Temperature */}
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                  <Thermometer className="w-3 h-3" />
                  <span>Temp</span>
                </div>
                <div className={`text-2xl font-bold ${getTemperatureColor(gpu.temperature_c)}`}>
                  {gpu.temperature_c}°C
                </div>
                <div className="mt-2 flex items-center gap-1">
                  {gpu.temperature_c < 70 ? (
                    <CheckCircle className="w-3 h-3 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-yellow-400" />
                  )}
                  <span className="text-xs text-gray-400">
                    {gpu.temperature_c < 50 ? 'Cool' : gpu.temperature_c < 70 ? 'Normal' : 'Hot'}
                  </span>
                </div>
              </div>

              {/* Power */}
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                  <Zap className="w-3 h-3" />
                  <span>Power</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {gpu.power.draw_watts.toFixed(0)}<span className="text-sm text-gray-400">W</span>
                </div>
                <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-500 transition-all"
                    style={{ width: `${(gpu.power.draw_watts / gpu.power.limit_watts) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* MIG Instances */}
            {gpu.mig.enabled && gpu.mig.instances && gpu.mig.instances.length > 0 && (
              <div className="pt-3 border-t border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-gray-400">MIG Instances</span>
                  <button
                    onClick={() => onShowTechPopup?.('mig')}
                    className="text-xs text-purple-400 hover:text-purple-300"
                  >
                    Learn more
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {gpu.mig.instances.map((instance) => (
                    <span 
                      key={instance.index}
                      className="px-2 py-1 text-xs bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-300"
                    >
                      {instance.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-black/20 border-t border-white/5">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {gpuData?.driver_version && `Driver: ${gpuData.driver_version}`}
            {gpuData?.mock_data && 'Showing demo data - connect GPU for real metrics'}
          </span>
          <span>
            Last updated: {gpuData?.timestamp ? new Date(gpuData.timestamp).toLocaleTimeString() : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
}

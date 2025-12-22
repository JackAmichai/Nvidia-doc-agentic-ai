'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, ExternalLink, Sparkles, Shield, Cpu, Server, Zap, Brain, Database, Mic } from 'lucide-react';

export type NvidiaTechType = 
  | 'nim' 
  | 'nemo-guardrails' 
  | 'triton' 
  | 'tensorrt' 
  | 'riva' 
  | 'rapids' 
  | 'milvus'
  | 'pynvml'
  | 'cuda';

interface TechInfo {
  name: string;
  shortDescription: string;
  icon: React.ReactNode;
  color: string;
  fullDescription: string;
  features: string[];
  learnMoreUrl: string;
  badgeText: string;
}

const TECH_INFO: Record<NvidiaTechType, TechInfo> = {
  'nim': {
    name: 'NVIDIA NIM',
    shortDescription: 'We use NVIDIA NIM for state-of-the-art LLM inference!',
    icon: <Brain className="w-6 h-6" />,
    color: 'from-green-500 to-emerald-600',
    fullDescription: 'NVIDIA NIM (NVIDIA Inference Microservices) provides optimized AI model deployment with industry-leading performance. Your queries are processed using NVIDIA-optimized large language models running on powerful GPU infrastructure.',
    features: [
      'Up to 3x faster inference compared to standard deployments',
      'Optimized for NVIDIA GPUs with TensorRT-LLM',
      'Enterprise-grade security and reliability',
      'Access to latest models: Llama 3, Mixtral, and more'
    ],
    learnMoreUrl: 'https://developer.nvidia.com/nim',
    badgeText: 'Powered by NIM'
  },
  'nemo-guardrails': {
    name: 'NVIDIA NeMo Guardrails',
    shortDescription: 'Your conversation is protected by NeMo Guardrails!',
    icon: <Shield className="w-6 h-6" />,
    color: 'from-blue-500 to-indigo-600',
    fullDescription: 'NeMo Guardrails is NVIDIA\'s open-source toolkit for adding programmable guardrails to LLM-based conversational applications. It ensures safe, accurate, and on-topic responses.',
    features: [
      'Topical rails keep conversations focused on NVIDIA documentation',
      'Fact-checking rails prevent hallucinations',
      'Jailbreak protection for enterprise security',
      'Customizable safety policies'
    ],
    learnMoreUrl: 'https://github.com/NVIDIA/NeMo-Guardrails',
    badgeText: 'Guardrails Active'
  },
  'triton': {
    name: 'NVIDIA Triton Inference Server',
    shortDescription: 'Embeddings powered by Triton Inference Server!',
    icon: <Server className="w-6 h-6" />,
    color: 'from-purple-500 to-violet-600',
    fullDescription: 'Triton Inference Server provides a cloud and edge inferencing solution optimized for both CPUs and GPUs. We use it for high-performance embedding generation.',
    features: [
      'Multi-model serving with dynamic batching',
      'Supports TensorRT, PyTorch, TensorFlow, ONNX',
      'GPU-accelerated embedding generation',
      'Horizontal scaling for production workloads'
    ],
    learnMoreUrl: 'https://developer.nvidia.com/triton-inference-server',
    badgeText: 'Triton Powered'
  },
  'tensorrt': {
    name: 'NVIDIA TensorRT',
    shortDescription: 'Models optimized with TensorRT for maximum speed!',
    icon: <Zap className="w-6 h-6" />,
    color: 'from-orange-500 to-amber-600',
    fullDescription: 'TensorRT is NVIDIA\'s high-performance deep learning inference optimizer and runtime. It delivers low latency and high throughput for inference applications.',
    features: [
      'Layer fusion and kernel auto-tuning',
      'FP16 and INT8 precision optimization',
      'Up to 40x faster than CPU inference',
      'Optimized for NVIDIA GPUs'
    ],
    learnMoreUrl: 'https://developer.nvidia.com/tensorrt',
    badgeText: 'TensorRT Optimized'
  },
  'riva': {
    name: 'NVIDIA Riva',
    shortDescription: 'Voice interaction powered by NVIDIA Riva!',
    icon: <Mic className="w-6 h-6" />,
    color: 'from-pink-500 to-rose-600',
    fullDescription: 'NVIDIA Riva is a GPU-accelerated SDK for building speech AI applications. It provides state-of-the-art speech recognition and text-to-speech capabilities.',
    features: [
      'Real-time speech recognition (ASR)',
      'Natural text-to-speech (TTS)',
      'Support for 20+ languages',
      'Customizable for domain-specific vocabulary'
    ],
    learnMoreUrl: 'https://developer.nvidia.com/riva',
    badgeText: 'Riva Voice AI'
  },
  'rapids': {
    name: 'NVIDIA RAPIDS',
    shortDescription: 'Data processing accelerated by NVIDIA RAPIDS!',
    icon: <Database className="w-6 h-6" />,
    color: 'from-cyan-500 to-teal-600',
    fullDescription: 'RAPIDS is a suite of open-source software libraries for executing end-to-end data science and analytics pipelines entirely on GPUs.',
    features: [
      'GPU-accelerated DataFrames with cuDF',
      '50x faster data processing than pandas',
      'Seamless integration with Python ecosystem',
      'GPU-accelerated machine learning with cuML'
    ],
    learnMoreUrl: 'https://rapids.ai/',
    badgeText: 'RAPIDS Accelerated'
  },
  'milvus': {
    name: 'Milvus with GPU',
    shortDescription: 'Vector search powered by GPU-accelerated Milvus!',
    icon: <Database className="w-6 h-6" />,
    color: 'from-indigo-500 to-blue-600',
    fullDescription: 'Milvus is an open-source vector database built for scalable similarity search. With GPU acceleration, it delivers blazing-fast vector retrieval.',
    features: [
      'GPU-accelerated similarity search',
      'Billions of vectors at millisecond latency',
      'Multiple index types (IVF, HNSW, FLAT)',
      'Cloud-native and highly scalable'
    ],
    learnMoreUrl: 'https://milvus.io/',
    badgeText: 'GPU Vector Search'
  },
  'pynvml': {
    name: 'NVIDIA Management Library',
    shortDescription: 'Real-time GPU monitoring with NVML!',
    icon: <Cpu className="w-6 h-6" />,
    color: 'from-gray-500 to-slate-600',
    fullDescription: 'NVIDIA Management Library (NVML) provides programmatic access to GPU monitoring and management capabilities. We use it to show real-time GPU metrics.',
    features: [
      'Real-time GPU utilization monitoring',
      'Memory usage tracking',
      'Temperature and power monitoring',
      'MIG instance management'
    ],
    learnMoreUrl: 'https://developer.nvidia.com/nvidia-management-library-nvml',
    badgeText: 'NVML Monitoring'
  },
  'cuda': {
    name: 'NVIDIA CUDA',
    shortDescription: 'Powered by NVIDIA CUDA parallel computing!',
    icon: <Sparkles className="w-6 h-6" />,
    color: 'from-green-500 to-lime-600',
    fullDescription: 'CUDA is NVIDIA\'s parallel computing platform and programming model. It enables dramatic performance increases by harnessing the power of GPUs.',
    features: [
      'Massively parallel computing',
      'Thousands of cores for acceleration',
      'Rich ecosystem of libraries',
      'Industry standard for GPU computing'
    ],
    learnMoreUrl: 'https://developer.nvidia.com/cuda-toolkit',
    badgeText: 'CUDA Accelerated'
  }
};

interface NvidiaTechPopupProps {
  techType: NvidiaTechType;
  isVisible: boolean;
  onClose: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  autoHide?: number; // milliseconds, 0 = no auto-hide
}

export default function NvidiaTechPopup({
  techType,
  isVisible,
  onClose,
  position = 'bottom-right',
  autoHide = 0
}: NvidiaTechPopupProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const tech = TECH_INFO[techType];

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      setIsExpanded(false);
      
      if (autoHide > 0) {
        const timer = setTimeout(() => {
          if (!isExpanded) {
            onClose();
          }
        }, autoHide);
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, autoHide, onClose, isExpanded]);

  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!isAnimating && !isVisible) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-24 right-4',
    'bottom-left': 'bottom-24 left-4',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
  };

  return (
    <div 
      className={`fixed ${positionClasses[position]} z-[100] transition-all duration-300 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
    >
      <div className={`
        relative overflow-hidden rounded-2xl shadow-2xl
        bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950
        border border-white/10
        ${isExpanded ? 'w-96' : 'w-80'}
        transition-all duration-300
      `}>
        {/* Gradient accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${tech.color}`} />
        
        {/* Header */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${tech.color} shadow-lg`}>
                {tech.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm">{tech.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r ${tech.color} text-white`}>
                    {tech.badgeText}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  {tech.shortDescription}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Learn More Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            type="button"
            className={`
              mt-3 w-full flex items-center justify-center gap-2 
              px-4 py-2.5 rounded-xl text-sm font-medium
              bg-white/10 hover:bg-white/20 border border-white/20
              text-white transition-all duration-200
              cursor-pointer select-none
            `}
          >
            {isExpanded ? (
              <>
                <span>Show Less</span>
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Learn More</span>
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
        
        {/* Expanded Content */}
        <div className={`
          overflow-hidden transition-all duration-300
          ${isExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}
        `}>
          <div className="px-4 pb-4 space-y-4">
            {/* Divider */}
            <div className="border-t border-white/10" />
            
            {/* Full Description */}
            <p className="text-sm text-gray-300 leading-relaxed">
              {tech.fullDescription}
            </p>
            
            {/* Features */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Key Features
              </h4>
              <ul className="space-y-2">
                {tech.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                    <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${tech.color} mt-1.5 flex-shrink-0`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* External Link */}
            <a
              href={tech.learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                flex items-center justify-center gap-2
                w-full px-4 py-3 rounded-xl
                bg-gradient-to-r ${tech.color}
                text-white text-sm font-semibold
                hover:opacity-90 transition-opacity
                shadow-lg
              `}
            >
              <span>Visit Official Documentation</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for managing tech popups
export function useNvidiaTechPopup() {
  const [activePopup, setActivePopup] = useState<NvidiaTechType | null>(null);
  const [popupQueue, setPopupQueue] = useState<NvidiaTechType[]>([]);

  const showPopup = (techType: NvidiaTechType) => {
    if (activePopup) {
      // Queue the popup if one is already showing
      setPopupQueue(prev => [...prev, techType]);
    } else {
      setActivePopup(techType);
    }
  };

  const hidePopup = () => {
    setActivePopup(null);
    // Show next popup in queue after a short delay
    setTimeout(() => {
      if (popupQueue.length > 0) {
        const [next, ...rest] = popupQueue;
        setPopupQueue(rest);
        setActivePopup(next);
      }
    }, 300);
  };

  const showMultiplePopups = (techTypes: NvidiaTechType[], delay: number = 500) => {
    techTypes.forEach((tech, index) => {
      setTimeout(() => showPopup(tech), index * delay);
    });
  };

  return {
    activePopup,
    showPopup,
    hidePopup,
    showMultiplePopups,
    isPopupVisible: activePopup !== null
  };
}

import { NextResponse } from 'next/server';

export async function GET() {
    const technologies = [
        {
            id: 'nim',
            name: 'NVIDIA NIM',
            description: 'NVIDIA Inference Microservices for optimized LLM deployment',
            active: !!process.env.NVIDIA_API_KEY,
            icon: '🧠',
            docsUrl: 'https://developer.nvidia.com/nim',
            features: [
                'Optimized inference on NVIDIA GPUs',
                'OpenAI-compatible API',
                'Support for Llama, Mistral, DeepSeek models',
                'Enterprise-grade scalability'
            ]
        },
        {
            id: 'cuda',
            name: 'CUDA',
            description: 'Parallel computing platform for GPU acceleration',
            active: true,
            icon: '⚡',
            docsUrl: 'https://developer.nvidia.com/cuda-toolkit',
            features: [
                'GPU-accelerated computing',
                'Parallel programming model',
                'Extensive library ecosystem',
                'Cross-platform support'
            ]
        },
        {
            id: 'tensorrt',
            name: 'TensorRT',
            description: 'High-performance deep learning inference optimizer',
            active: true,
            icon: '🚀',
            docsUrl: 'https://developer.nvidia.com/tensorrt',
            features: [
                'Layer fusion optimization',
                'FP16/INT8 precision',
                'Dynamic shapes support',
                'Multi-GPU inference'
            ]
        },
        {
            id: 'triton',
            name: 'Triton Inference Server',
            description: 'Open-source inference serving software',
            active: true,
            icon: '🖥️',
            docsUrl: 'https://developer.nvidia.com/nvidia-triton-inference-server',
            features: [
                'Multi-framework support',
                'Dynamic batching',
                'Model versioning',
                'Kubernetes integration'
            ]
        },
        {
            id: 'nemo',
            name: 'NeMo Framework',
            description: 'End-to-end platform for building generative AI',
            active: true,
            icon: '🔮',
            docsUrl: 'https://developer.nvidia.com/nemo',
            features: [
                'LLM training and fine-tuning',
                'Speech AI models',
                'Multimodal AI',
                'Production deployment'
            ]
        }
    ];

    return NextResponse.json({
        technologies,
        active_count: technologies.filter(t => t.active).length,
        llm_info: {
            provider: process.env.NVIDIA_API_KEY ? 'nvidia_nim' : 'mock',
            model: process.env.NVIDIA_MODEL || 'deepseek-ai/deepseek-r1',
            is_nvidia: !!process.env.NVIDIA_API_KEY
        }
    });
}

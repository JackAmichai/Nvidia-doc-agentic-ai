"""
Sample data ingestion script
Adds sample NVIDIA documentation to the vector store for testing.
"""

import sys
import os

# Add the backend directory to the path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from app.services.vector_store import VectorStoreService

# Sample NVIDIA documentation
sample_docs = [
    {
        "url": "https://docs.nvidia.com/cuda/cuda-c-programming-guide/",
        "title": "CUDA C Programming Guide - Introduction",
        "content": """CUDA is a parallel computing platform and programming model developed by NVIDIA for general computing on graphical processing units (GPUs). With CUDA, developers can dramatically speed up computing applications by harnessing the power of GPUs.

In GPU-accelerated applications, the sequential part of the workload runs on the CPU, which is optimized for single-threaded performance, while the compute-intensive portion of the application runs on thousands of GPU cores in parallel.

CUDA provides a simple path for users familiar with standard programming languages such as C to easily write programs for execution by the device. The CUDA programming model assumes that the CUDA threads execute on a physically separate device that operates as a coprocessor to the host running the C program.""",
        "source": "cuda_docs"
    },
    {
        "url": "https://docs.nvidia.com/cuda/cuda-c-programming-guide/index.html#kernels",
        "title": "CUDA Kernels",
        "content": """CUDA C extends C by allowing the programmer to define C functions, called kernels, that, when called, are executed N times in parallel by N different CUDA threads, as opposed to only once like regular C functions.

A kernel is defined using the __global__ declaration specifier and the number of CUDA threads that execute that kernel for a given kernel call is specified using a new <<<...>>> execution configuration syntax.

Each thread that executes the kernel is given a unique thread ID that is accessible within the kernel through the built-in threadIdx variable. The following code shows how to use thread IDs to add two vectors.""",
        "source": "cuda_docs"
    },
    {
        "url": "https://docs.nvidia.com/deeplearning/tensorrt/developer-guide/",
        "title": "TensorRT Developer Guide - Introduction",
        "content": """NVIDIA TensorRT is an SDK for high-performance deep learning inference. It includes a deep learning inference optimizer and runtime that delivers low latency and high throughput for deep learning inference applications.

TensorRT-based applications perform up to 40x faster than CPU-only platforms during inference. With TensorRT, you can optimize neural network models trained in all major frameworks, calibrate for lower precision with high accuracy, and deploy to hyperscale data centers, embedded, or automotive product platforms.

TensorRT supports TensorFlow, PyTorch, and ONNX models. It provides optimizations such as layer fusion, precision calibration, and kernel auto-tuning.""",
        "source": "tensorrt_docs"
    },
    {
        "url": "https://docs.nvidia.com/deeplearning/tensorrt/developer-guide/index.html#precision",
        "title": "TensorRT - Reduced Precision",
        "content": """TensorRT supports FP32, FP16, and INT8 precision. Using reduced precision can significantly improve performance while maintaining accuracy.

FP16 (half precision) can provide up to 2x speedup compared to FP32 on modern NVIDIA GPUs. INT8 quantization can provide even greater speedups, up to 4x, with minimal accuracy loss when properly calibrated.

To use FP16 precision, set the builder flag: builder.fp16_mode = True. For INT8, you need to provide calibration data to determine optimal quantization parameters.""",
        "source": "tensorrt_docs"
    },
    {
        "url": "https://docs.nvidia.com/datacenter/tesla/mig-user-guide/",
        "title": "MIG User Guide - Introduction",
        "content": """Multi-Instance GPU (MIG) is a feature of NVIDIA A100 and H100 GPUs that enables a single GPU to be partitioned into multiple GPU instances. Each instance has separate and isolated paths through the entire memory system - the on-chip crossbar ports, L2 cache banks, memory controllers, and DRAM address busses are all assigned uniquely to an individual instance.

MIG provides multiple users with separate GPU resources for optimal GPU utilization. This is particularly useful in multi-tenant environments where different users or applications need guaranteed quality of service.

To enable MIG mode, use: nvidia-smi -i 0 -mig 1. Then create instances using: nvidia-smi mig -cgi <profile>.""",
        "source": "mig_guide"
    },
    {
        "url": "https://docs.nvidia.com/datacenter/tesla/mig-user-guide/index.html#kubernetes",
        "title": "MIG with Kubernetes",
        "content": """To use MIG with Kubernetes, you need to configure the NVIDIA device plugin with MIG support. The device plugin exposes MIG devices to Kubernetes as schedulable resources.

Key configuration options:
- mig-strategy: Controls how MIG devices are exposed (single or mixed)
- device-list-strategy: Determines how devices are discovered (envvar or volume-mounts)

Ensure your kubelet is configured to use the NVIDIA runtime and that the device plugin daemonset is deployed with the correct MIG configuration flags.""",
        "source": "mig_guide"
    },
    {
        "url": "https://docs.nvidia.com/deploy/nvml-api/group__nvmlDeviceQueries.html",
        "title": "NVML API - NVLink Queries",
        "content": """The NVIDIA Management Library (NVML) provides APIs to query NVLink status and topology. NVLink is NVIDIA's high-speed interconnect technology for GPU-to-GPU and GPU-to-CPU communication.

Key NVML functions for NVLink:
- nvmlDeviceGetNvLinkState(): Get the state of a specific NVLink
- nvmlDeviceGetNvLinkVersion(): Get NVLink version
- nvmlDeviceGetNvLinkCapability(): Query NVLink capabilities
- nvmlDeviceGetNvLinkRemotePciInfo(): Get information about the remote device

To check NVLink status from command line: nvidia-smi nvlink --status""",
        "source": "nvml_docs"
    },
    {
        "url": "https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html#profiling",
        "title": "CUDA Best Practices - Profiling",
        "content": """Profiling is essential for optimizing CUDA applications. NVIDIA provides several profiling tools:

1. Nsight Systems: System-wide performance analysis tool for visualizing application timeline
2. Nsight Compute: Detailed kernel profiling and optimization tool
3. NVIDIA Visual Profiler: Legacy profiling tool (deprecated, use Nsight tools)

Common profiling workflow:
1. Use Nsight Systems to identify performance bottlenecks at the application level
2. Use Nsight Compute to analyze specific kernels in detail
3. Optimize based on metrics like occupancy, memory bandwidth, and instruction throughput

To profile with Nsight Systems: nsys profile ./your_app""",
        "source": "cuda_docs"
    },
    {
        "url": "https://github.com/NVIDIA/NeMo",
        "title": "NeMo - Conversational AI Toolkit",
        "content": """NVIDIA NeMo is a toolkit for building, training, and fine-tuning GPU-accelerated speech AI and natural language understanding models.

NeMo supports:
- Automatic Speech Recognition (ASR)
- Natural Language Processing (NLP)
- Text-to-Speech (TTS)
- Large Language Models (LLMs)

Key features:
- Pre-trained models available on NGC
- Easy fine-tuning with your own data
- Multi-GPU and multi-node training
- Integration with PyTorch Lightning
- Export to ONNX and TensorRT for deployment

Install NeMo: pip install nemo_toolkit[all]""",
        "source": "nemo_github"
    },
    {
        "url": "https://github.com/triton-inference-server/server",
        "title": "Triton Inference Server",
        "content": """NVIDIA Triton Inference Server is an open-source inference serving software that streamlines AI inferencing. Triton enables teams to deploy any AI model from multiple deep learning and machine learning frameworks.

Key features:
- Support for TensorFlow, PyTorch, ONNX, TensorRT, and custom backends
- Dynamic batching for improved throughput
- Model versioning and A/B testing
- Concurrent model execution
- GPU and CPU support
- Kubernetes and cloud deployment ready

Deploy a model to Triton by placing it in the model repository with a config.pbtxt configuration file.""",
        "source": "triton_github"
    }
]

def main():
    print("="*80)
    print("NVIDIA Doc Navigator - Sample Data Ingestion")
    print("="*80)
    
    # Initialize vector store
    print("\n📦 Initializing vector store...")
    vector_store = VectorStoreService()
    
    # Check current stats
    stats = vector_store.get_collection_stats()
    print(f"Current documents in store: {stats['total_documents']}")
    
    # Add sample documents
    print(f"\n📝 Adding {len(sample_docs)} sample documents...")
    vector_store.add_documents(sample_docs)
    
    # Check updated stats
    stats = vector_store.get_collection_stats()
    print(f"✅ Total documents now: {stats['total_documents']}")
    
    # Test search
    print("\n🔍 Testing search functionality...")
    test_queries = [
        "What is CUDA?",
        "How do I use FP16 in TensorRT?",
        "Configure MIG on Kubernetes",
        "Check NVLink status"
    ]
    
    for query in test_queries:
        print(f"\nQuery: {query}")
        results = vector_store.search(query, n_results=2)
        if results:
            print(f"  Top result: {results[0]['metadata'].get('title', 'N/A')}")
        else:
            print("  No results found")
    
    print("\n" + "="*80)
    print("✅ Sample data ingestion complete!")
    print("="*80)
    print("\nYou can now:")
    print("1. Start the backend: uvicorn app.main:app --reload")
    print("2. Start the frontend: npm run dev")
    print("3. Open http://localhost:3000 and start asking questions!")

if __name__ == "__main__":
    main()

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// NVIDIA NIM Configuration
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'deepseek-ai/deepseek-r1';

// System prompt for the NVIDIA Doc Navigator
const SYSTEM_PROMPT = `You are the NVIDIA Doc Navigator, an expert AI assistant for NVIDIA developers.
You have deep knowledge of:
- CUDA programming and optimization
- TensorRT for inference optimization
- Multi-Instance GPU (MIG) configuration
- NVLink and multi-GPU systems
- NVIDIA container toolkit
- cuDNN, cuBLAS, and other NVIDIA libraries
- NeMo framework for LLMs
- Triton Inference Server

When answering:
1. Provide step-by-step guidance with code examples
2. Include version requirements and compatibility notes
3. Cite official NVIDIA documentation when possible
4. Be precise about GPU architecture requirements (Ampere, Hopper, etc.)
5. When unsure, say "I cannot verify this from public documentation."

Never hallucinate unreleased hardware, internal systems, or private APIs.`;

// Sample NVIDIA documentation data for RAG context
const NVIDIA_DOCS_CONTEXT = `
## MIG (Multi-Instance GPU) Configuration
MIG is available on NVIDIA A100, A30, and H100 GPUs. To enable MIG:
1. Enable MIG mode: sudo nvidia-smi -i <GPU_ID> -mig 1
2. Create GPU instances: sudo nvidia-smi mig -cgi <profile>
3. Create compute instances: sudo nvidia-smi mig -cci
Profiles: 1g.5gb, 2g.10gb, 3g.20gb, 4g.20gb, 7g.40gb (A100-40GB)

## CUDA Optimization Best Practices
- Use shared memory for frequently accessed data
- Coalesce memory accesses for global memory
- Use streams for concurrent kernel execution
- Profile with NVIDIA Nsight Systems and Nsight Compute
- Consider occupancy when choosing block sizes

## TensorRT Optimization
- Use FP16/INT8 precision for inference speedup
- Enable layer fusion and kernel auto-tuning
- Use dynamic shapes for variable batch sizes
- Build engine with: trtexec --onnx=model.onnx --saveEngine=model.trt --fp16

## NVLink Configuration
- Check NVLink status: nvidia-smi nvlink -s
- NVLink provides up to 600 GB/s bidirectional bandwidth on H100
- Enable peer-to-peer: cudaDeviceEnablePeerAccess()
`;

interface QueryRequest {
    query: string;
    n_results?: number;
    include_code_examples?: boolean;
}

interface Source {
    title: string;
    url: string;
    relevance: number;
}

interface QueryResponse {
    query: string;
    answer: string;
    query_type: string;
    confidence: number;
    sources: Source[];
    code_examples: CodeExample[];
    matched_keywords: string[];
    suggested_tags: string[];
    llm_info: {
        provider: string;
        model: string;
        is_nvidia: boolean;
    };
    nvidia_technologies: string[];
}

interface CodeExample {
    name: string;
    path: string;
    repo: string;
    url: string;
    description: string;
}

// Route the query to determine type
function routeQuery(query: string): { type: string; confidence: number; keywords: string[]; tags: string[] } {
    const lowerQuery = query.toLowerCase();
    
    const routingRules = [
        { type: 'mig_config', keywords: ['mig', 'multi-instance', 'partition', 'gpu instance'], tags: ['MIG', 'A100', 'Configuration'] },
        { type: 'cuda_general', keywords: ['cuda', 'kernel', 'thread', 'block', 'shared memory', 'global memory'], tags: ['CUDA', 'Programming'] },
        { type: 'cuda_profiling', keywords: ['nsight', 'profil', 'nvprof', 'performance', 'slow', 'optimize'], tags: ['Profiling', 'Performance'] },
        { type: 'tensorrt', keywords: ['tensorrt', 'trt', 'inference', 'fp16', 'int8', 'quantiz'], tags: ['TensorRT', 'Inference'] },
        { type: 'nvlink', keywords: ['nvlink', 'multi-gpu', 'peer', 'p2p', 'interconnect'], tags: ['NVLink', 'Multi-GPU'] },
        { type: 'nemo', keywords: ['nemo', 'megatron', 'llm', 'transformer'], tags: ['NeMo', 'LLM'] },
        { type: 'triton', keywords: ['triton', 'inference server', 'model serving'], tags: ['Triton', 'Serving'] },
    ];
    
    for (const rule of routingRules) {
        const matchedKeywords = rule.keywords.filter(kw => lowerQuery.includes(kw));
        if (matchedKeywords.length > 0) {
            return {
                type: rule.type,
                confidence: Math.min(0.9, 0.5 + matchedKeywords.length * 0.15),
                keywords: matchedKeywords,
                tags: rule.tags
            };
        }
    }
    
    return { type: 'generic', confidence: 0.5, keywords: [], tags: ['General'] };
}

// Get relevant sources based on query type
function getSources(queryType: string): Source[] {
    const sourceMap: Record<string, Source[]> = {
        mig_config: [
            { title: 'NVIDIA MIG User Guide', url: 'https://docs.nvidia.com/datacenter/tesla/mig-user-guide/', relevance: 0.95 },
            { title: 'A100 GPU Architecture', url: 'https://www.nvidia.com/en-us/data-center/a100/', relevance: 0.85 },
        ],
        cuda_general: [
            { title: 'CUDA C++ Programming Guide', url: 'https://docs.nvidia.com/cuda/cuda-c-programming-guide/', relevance: 0.95 },
            { title: 'CUDA Best Practices Guide', url: 'https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/', relevance: 0.90 },
        ],
        cuda_profiling: [
            { title: 'Nsight Systems User Guide', url: 'https://docs.nvidia.com/nsight-systems/', relevance: 0.95 },
            { title: 'Nsight Compute Documentation', url: 'https://docs.nvidia.com/nsight-compute/', relevance: 0.90 },
        ],
        tensorrt: [
            { title: 'TensorRT Developer Guide', url: 'https://docs.nvidia.com/deeplearning/tensorrt/developer-guide/', relevance: 0.95 },
            { title: 'TensorRT Quick Start', url: 'https://docs.nvidia.com/deeplearning/tensorrt/quick-start-guide/', relevance: 0.85 },
        ],
        nvlink: [
            { title: 'NVLink and NVSwitch', url: 'https://www.nvidia.com/en-us/data-center/nvlink/', relevance: 0.95 },
            { title: 'Multi-GPU Programming', url: 'https://docs.nvidia.com/cuda/cuda-c-programming-guide/index.html#multi-device-system', relevance: 0.85 },
        ],
        nemo: [
            { title: 'NVIDIA NeMo Framework', url: 'https://docs.nvidia.com/nemo-framework/', relevance: 0.95 },
            { title: 'NeMo GitHub', url: 'https://github.com/NVIDIA/NeMo', relevance: 0.85 },
        ],
        triton: [
            { title: 'Triton Inference Server', url: 'https://docs.nvidia.com/deeplearning/triton-inference-server/', relevance: 0.95 },
            { title: 'Triton GitHub', url: 'https://github.com/triton-inference-server/server', relevance: 0.85 },
        ],
        generic: [
            { title: 'NVIDIA Developer Documentation', url: 'https://developer.nvidia.com/documentation', relevance: 0.70 },
            { title: 'NVIDIA NGC Catalog', url: 'https://catalog.ngc.nvidia.com/', relevance: 0.65 },
        ],
    };
    
    return sourceMap[queryType] || sourceMap.generic;
}

function generateMockAnswer(query: string, queryType: string, sources: Source[]): string {
    const typeIntros: Record<string, string> = {
        mig_config: "Based on NVIDIA's MIG documentation:\n\n",
        cuda_general: "From the CUDA programming guide:\n\n",
        cuda_profiling: "According to NVIDIA profiling documentation:\n\n",
        tensorrt: "Based on TensorRT documentation:\n\n",
        nvlink: "From NVIDIA's NVLink documentation:\n\n",
        nemo: "According to NeMo framework documentation:\n\n",
        triton: "From Triton Inference Server docs:\n\n",
        generic: "Based on NVIDIA documentation:\n\n",
    };
    
    let answer = typeIntros[queryType] || typeIntros.generic;
    
    if (queryType === 'mig_config') {
        answer += `**MIG Configuration Steps:**

1. **Enable MIG mode** on your A100/A30/H100 GPU:
   \`\`\`bash
   sudo nvidia-smi -i 0 -mig 1
   \`\`\`

2. **Create GPU instances** (choose profile based on your needs):
   \`\`\`bash
   sudo nvidia-smi mig -cgi 1g.5gb,2g.10gb -i 0
   \`\`\`

3. **Create compute instances**:
   \`\`\`bash
   sudo nvidia-smi mig -cci -i 0
   \`\`\`

4. **Verify configuration**:
   \`\`\`bash
   nvidia-smi -L
   \`\`\`

**Available profiles for A100-40GB:** 1g.5gb, 2g.10gb, 3g.20gb, 4g.20gb, 7g.40gb`;
    } else if (queryType === 'cuda_profiling') {
        answer += `**Debugging Slow CUDA Kernels:**

1. **Profile with Nsight Systems** to get overall timeline:
   \`\`\`bash
   nsys profile --stats=true ./your_app
   \`\`\`

2. **Analyze with Nsight Compute** for detailed kernel metrics:
   \`\`\`bash
   ncu --set full -o profile ./your_app
   \`\`\`

3. **Common issues to check:**
   - Memory coalescing (check memory throughput)
   - Occupancy (aim for >50%)
   - Shared memory bank conflicts
   - Warp divergence

4. **Quick fixes:**
   - Increase block size for better occupancy
   - Use shared memory for repeated accesses
   - Ensure aligned memory accesses`;
    } else if (queryType === 'tensorrt') {
        answer += `**TensorRT Optimization Guide:**

1. **Convert your model to TensorRT**:
   \`\`\`bash
   trtexec --onnx=model.onnx --saveEngine=model.trt --fp16
   \`\`\`

2. **Enable INT8 quantization** for maximum performance:
   \`\`\`bash
   trtexec --onnx=model.onnx --saveEngine=model.trt --int8 --calib=calibration_data
   \`\`\`

3. **Key optimizations:**
   - Layer fusion reduces memory bandwidth
   - Kernel auto-tuning finds optimal algorithms
   - Dynamic shapes for variable batch sizes`;
    } else if (queryType === 'cuda_general') {
        answer += `**CUDA Programming Best Practices:**

1. **Memory hierarchy optimization:**
   - Global memory: ~900 GB/s (A100)
   - Shared memory: ~19 TB/s
   - Registers: fastest, limited per thread

2. **Thread organization:**
   \`\`\`cpp
   dim3 blockDim(256);
   dim3 gridDim((N + 255) / 256);
   myKernel<<<gridDim, blockDim>>>(data, N);
   \`\`\`

3. **Coalesced memory access:**
   - Consecutive threads should access consecutive memory
   - Align data to 128-byte boundaries`;
    } else {
        answer += `I found relevant information for your query about "${query}".\n\n`;
        answer += `Please refer to the official documentation for detailed guidance.\n\n`;
    }
    
    answer += `\n\n**📚 Sources:**\n`;
    sources.forEach((s, i) => {
        answer += `${i + 1}. [${s.title}](${s.url})\n`;
    });
    
    return answer;
}

function getCodeExamples(queryType: string): CodeExample[] {
    const examples: Record<string, CodeExample[]> = {
        cuda_general: [
            {
                name: 'vectorAdd.cu',
                path: 'samples/vectorAdd',
                repo: 'NVIDIA/cuda-samples',
                url: 'https://github.com/NVIDIA/cuda-samples/tree/master/Samples/0_Introduction/vectorAdd',
                description: 'Basic CUDA vector addition example'
            }
        ],
        tensorrt: [
            {
                name: 'trtexec',
                path: 'samples/trtexec',
                repo: 'NVIDIA/TensorRT',
                url: 'https://github.com/NVIDIA/TensorRT/tree/main/samples/trtexec',
                description: 'TensorRT command-line wrapper'
            }
        ],
        mig_config: [
            {
                name: 'mig-parted',
                path: '/',
                repo: 'NVIDIA/mig-parted',
                url: 'https://github.com/NVIDIA/mig-parted',
                description: 'MIG partition editor for Kubernetes'
            }
        ],
        cuda_profiling: [
            {
                name: 'Nsight Systems Examples',
                path: 'samples',
                repo: 'NVIDIA/nsight-systems',
                url: 'https://docs.nvidia.com/nsight-systems/UserGuide/index.html',
                description: 'Profiling examples and tutorials'
            }
        ],
    };
    
    return examples[queryType] || [];
}

export async function POST(request: NextRequest) {
    try {
        const body: QueryRequest = await request.json();
        const { query, include_code_examples = true } = body;
        
        if (!query || typeof query !== 'string') {
            return NextResponse.json(
                { error: 'Query is required and must be a string' },
                { status: 400 }
            );
        }
        
        // Route the query
        const routing = routeQuery(query);
        
        // Get relevant sources
        const sources = getSources(routing.type);
        
        let answer: string;
        let llmProvider = 'mock';
        let llmModel = 'none';
        let isNvidia = false;
        
        // Try NVIDIA NIM API
        if (NVIDIA_API_KEY) {
            try {
                const client = new OpenAI({
                    baseURL: NVIDIA_BASE_URL,
                    apiKey: NVIDIA_API_KEY,
                });
                
                const completion = await client.chat.completions.create({
                    model: NVIDIA_MODEL,
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        { role: 'user', content: `Context from NVIDIA documentation:\n${NVIDIA_DOCS_CONTEXT}\n\nUser Question: ${query}` }
                    ],
                    temperature: 0.6,
                    top_p: 0.7,
                    max_tokens: 4096,
                });
                
                answer = completion.choices[0]?.message?.content || 'Unable to generate response.';
                llmProvider = 'nvidia_nim';
                llmModel = NVIDIA_MODEL;
                isNvidia = true;
                
            } catch (error) {
                console.error('NVIDIA NIM API error:', error);
                answer = generateMockAnswer(query, routing.type, sources);
            }
        } else {
            answer = generateMockAnswer(query, routing.type, sources);
        }
        
        const response: QueryResponse = {
            query,
            answer,
            query_type: routing.type,
            confidence: routing.confidence,
            sources,
            code_examples: include_code_examples ? getCodeExamples(routing.type) : [],
            matched_keywords: routing.keywords,
            suggested_tags: routing.tags,
            llm_info: {
                provider: llmProvider,
                model: llmModel,
                is_nvidia: isNvidia,
            },
            nvidia_technologies: isNvidia ? ['nim', 'cuda'] : ['cuda'],
        };
        
        return NextResponse.json(response);
        
    } catch (error) {
        console.error('Query API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        status: 'healthy',
        endpoint: '/api/query',
        method: 'POST',
        nvidia_api_configured: !!NVIDIA_API_KEY,
    });
}

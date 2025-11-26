# NVIDIA Doc Navigator

A Unified AI Assistant for Navigating Fragmented NVIDIA Documentation, Examples & Troubleshooting Guides

---

## Overview

**NVIDIA Doc Navigator** is an AI-powered agent that provides unified, accurate, and version-specific answers to NVIDIA developers' questions—using only public, approved sources such as docs.nvidia.com, official GitHub repos, and NVIDIA support forums. This tool quickly guides users to solutions, code samples, and troubleshooting steps for CUDA, TensorRT, NeMo, Triton, NVLink/MIG, and more.

---

## Problem Statement

NVIDIA documentation is often fragmented, scattered across different sources, and difficult to search:
- **Multiple documentation portals:** Official docs, GitHub, forums, blogs, and more.
- **Inconsistent guidance:** Broken links, outdated or contradictory information.
- **Poor searchability:** Built-in and generic search tools often fail to give relevant, up-to-date results.

**Result:** Slow onboarding, wasted engineering hours, version mismatch errors, and high activation energy before productivity.

---

## Product Vision

The one-stop AI agent for all NVIDIA developer documentation:
- Ingests only public NVIDIA documentation and examples
- Uses Retrieval-Augmented Generation (RAG) plus routing for fast, accurate, version-aware answers
- Unifies examples from GitHub & docs
- Provides step-by-step debugging and configuration guides
- Always cites sources and returns non-IP-sensitive, public data only

---

## Target Users

- CUDA developers and ML engineers
- DevOps managing multi-GPU infra
- Students/engineers onboarding NVIDIA tech
- Edge and cloud practitioners (Jetson, AWS/GCP with NVIDIA GPUs)

---

## Value Proposition

| Pain Point               | Value Delivered                       |
|--------------------------|---------------------------------------|
| Docs are fragmented      | Unified search across public sources  |
| Version confusion        | Version-aware, compatibility answers  |
| Sparse examples          | Auto-retrieved example code           |
| MIG/NVLink complexity    | Step-by-step config guides            |
| Debugging difficulties   | Built-in troubleshooting/flows        |
| Slow ramp-up             | Quick-start flows by experience/tracks|

---

## Core Features (MVP)

### F1 — Unified RAG Search  
Unified retrieval over:
- [NVIDIA Docs](https://docs.nvidia.com)
- [CUDA Toolkit Docs](https://docs.nvidia.com/cuda)
- [Triton Server](https://github.com/triton-inference-server/server)
- [NeMo](https://github.com/NVIDIA/NeMo)
- [TensorRT Docs](https://docs.nvidia.com/deeplearning/tensorrt)
- [NVML API](https://docs.nvidia.com/deploy/nvml-api/index.html)
- [NVIDIA Dev Forums](https://forums.developer.nvidia.com)
- Official NVIDIA GitHub repositories

**Vector Schema Example**:
```json
{
  "id": "cuda-docs-12-4-kernels",
  "source": "docs.nvidia.com/cuda",
  "title": "CUDA Kernels - Device Execution",
  "content": "<<< text chunk >>>",
  "version": "12.4",
  "tags": ["cuda", "kernel", "execution", "programming"],
  "url": "https://docs.nvidia.com/cuda/cuda-c-programming-guide"
}
```

### F2 — Developer Query Router  
Routes user queries to correct module (CUDA, MIG, NVLink, TensorRT, NeMo, Triton, generic CUDA).

### F3 — Code Example Generator  
Fetches examples from public GitHub via API queries (e.g., `https://api.github.com/search/code?q=cuda+gridDim+repo:NVIDIA/cuda-samples`), formats and injects relevant code.

### F4 — Version Compatibility Reasoner  
Provides version compatibility checks, warnings, and links to official tables for combinations like "TensorRT 10.0 with CUDA 12.1".

### F5 — Step-by-Step Debugger  
Guided troubleshooting flows for common issues (profiling crashes, MIG/K8s setup, etc.), with references to forums and docs.

---

## Non-Goals

- No use of internal/private NVIDIA data or tools  
- No predictions about unreleased products  
- No private benchmarks

---

## Example User Flows

1. **User Query:** "Why is my MIG instance not visible in Kubernetes on A100?"
2. **Router:** Sends to MIG/Kubernetes onboarding flow
3. **RAG Retrieval:** Fetches relevant sections from NVIDIA docs, GitHub, forums
4. **Version Reasoner:** Ensures instructions are correct for user-specified versions
5. **Example Builder:** Provides code/command examples
6. **Composed Answer:** Returns step-by-step validated solution, troubleshooting, and sources

---

## Prompts (For Agent Use)

### System Prompt
>You are the NVIDIA Doc Navigator.  
>You answer ONLY using public NVIDIA information.  
>When unsure, say "I cannot verify this from public data."  
>Always cite the specific docs or GitHub repo URLs.  
>Return step-by-step guidance, code examples, and version requirements.  
>Never hallucinate unreleased hardware, internal systems, or private APIs.

### Retrieval Prompt
>Given this query:  
>{{user_query}}  
>Search these categories: CUDA Toolkit, TensorRT, NeMo, Triton, NVML/NVLink/MIG, Developer Forums, Official GitHub repositories.  
>Return the top 5 most relevant chunks (200–500 tokens each).

### Answer Composition Prompt
>Using the retrieved chunks, build:  
>1. Direct answer (max 5 sentences)  
>2. Step-by-step instructions  
>3. Working code example (if applicable)  
>4. Version compatibility notes  
>5. Troubleshooting checklist  
>6. Sources with URLs  
>If any detail is not present in the docs, write: "Not available in public NVIDIA documentation."

---

## Stage-by-Stage Implementation Plan

### Stage 1 — Data Collection (RAG)
- Crawl allowed public URLs, chunk docs into 500–2,000 token windows, store in vector DB (Pinecone/Weaviate/Mongo Atlas).

### Stage 2 — Agent Creation
- Implement modular flows for: `mig_config`, `nvlink_debugger`, `tensorRT_examples`, `cuda_troubleshooting`, `nemo_workflows`.

### Stage 3 — Router Logic
- Create a keyword or LLM-based intent router.

### Stage 4 — Integration
- Deploy with Base44, AWS Bedrock, or custom FastAPI backend + Next.js UI.

### Stage 5 — Evaluation
- Use established LLM agent evaluation metrics (accuracy, coverage, user satisfaction).

---

## Example Output

>**User:** Why is my MIG instance not visible in Kubernetes on A100?  
>
>**Agent:**  
>Your MIG instance is not being recognized because the Kubernetes device plugin requires both the host driver and the container runtime to expose MIG devices.
>
>Step-by-step:
>1. Enable MIG mode: `sudo nvidia-smi -i 0 -mig 1`
>2. Create MIG instances: `sudo nvidia-smi mig -cgi 19,19 -C`
>3. Verify: `nvidia-smi -L`
>4. Ensure device plugin flags: `--mig-strategy=single`, `--device-list-strategy=envvar`
>5. Restart kubelet.
>
>Sources:  
>https://docs.nvidia.com/datacenter/cloud-native/kubernetes/device-plugin  
>https://docs.nvidia.com/datacenter/tesla/mig-user-guide

---

## Roadmap (3 Months)

| Month | Deliverables                                        |
|-------|-----------------------------------------------------|
| 1     | RAG dataset, embeddings, router                     |
| 2     | Debugging modules, example generator                |
| 3     | Version engine, compatibility matrix, user interface|

---

## Example Back-End (Python, FastAPI)

```python
from fastapi import FastAPI
from langchain.vectorstores import Pinecone
from openai import OpenAI

app = FastAPI()

@app.post("/query")
def query(q: str):
    docs = vectorstore.similarity_search(q, k=5)
    answer = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": build_retrieval_prompt(q, docs)},
        ],
        temperature=0.2
    )
    return answer.choices[0].message["content"]
```

---

## Next Steps

To generate full scaffolding, agents, prompts, and database schemas, run:

`“Generate the build kit for NVIDIA Doc Navigator.”`



## Project Structure
- `backend/`: FastAPI backend
- `frontend/`: Next.js frontend

## Setup

### Backend
1. Navigate to `backend/`
2. Create virtual environment: `python3 -m venv venv`
3. Activate: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Run: `uvicorn app.main:app --reload`

### Frontend
1. Navigate to `frontend/`
2. Install dependencies: `npm install`
3. Run: `npm run dev`

## Environment Variables
Create `.env` in `backend/` with:


---

© 2025 Jack Amichai — Production Specification for NVIDIA Doc Navigator
OPENAI_API_KEY=your_key
```

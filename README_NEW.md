# NVIDIA Doc Navigator 🚀

[![NVIDIA Technologies](https://img.shields.io/badge/NVIDIA-NIM%20%7C%20NeMo%20%7C%20CUDA-76B900?style=for-the-badge&logo=nvidia)](https://developer.nvidia.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)

A Unified AI Assistant for Navigating Fragmented NVIDIA Documentation, powered by **NVIDIA NIM**, **NeMo Guardrails**, and cutting-edge RAG technology.

![NVIDIA Doc Navigator Demo](https://via.placeholder.com/800x400/1a1a2e/76B900?text=NVIDIA+Doc+Navigator)

---

## 🌟 NVIDIA Technologies Showcase

This project demonstrates proficiency with the following NVIDIA technologies:

| Technology | Description | Implementation |
|------------|-------------|----------------|
| 🧠 **NVIDIA NIM** | State-of-the-art LLM inference | Primary LLM provider via `langchain-nvidia-ai-endpoints` |
| 🛡️ **NeMo Guardrails** | AI safety rails | Input/output validation, topic control |
| 📊 **NVML/pynvml** | GPU monitoring | Real-time metrics dashboard |
| ⚡ **CUDA** | Parallel computing | Backend processing |
| 🎯 **TensorRT** | Inference optimization | Model acceleration (planned) |
| 🖥️ **Triton** | Model serving | Embedding deployment (planned) |

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- NVIDIA GPU (optional, for real GPU metrics)
- NVIDIA API Key (get from [build.nvidia.com](https://build.nvidia.com))

### 1. Clone the Repository

```bash
git clone https://github.com/JackAmichai/Nvidia-doc-agentic-ai.git
cd Nvidia-doc-agentic-ai
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your NVIDIA_API_KEY

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

### 4. Open the App

Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🔑 API Keys Configuration

### NVIDIA NIM (Primary - Recommended)

1. Go to [build.nvidia.com](https://build.nvidia.com)
2. Sign up or log in
3. Select any model and click "Get API Key"
4. Add to `backend/.env`:

```env
NVIDIA_API_KEY=nvapi-your-key-here
NVIDIA_NIM_MODEL=meta/llama-3.1-70b-instruct
```

### Fallback Options

```env
# Hugging Face (Free)
HUGGINGFACE_API_KEY=hf_your_token

# OpenAI (Paid)
OPENAI_API_KEY=sk-your-key
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Chat UI   │  │ GPU Monitor │  │ Tech Popups │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  RAG Agent  │  │  Guardrails │  │ GPU Metrics │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                │                │                  │
│         ▼                ▼                ▼                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ NVIDIA NIM  │  │NeMo Guards  │  │   pynvml    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Vector Store (ChromaDB)                   │
│              NVIDIA Documentation & Examples                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/query` | POST | Query the AI assistant |
| `/api/v1/gpu-info` | GET | Real-time GPU metrics |
| `/api/v1/gpu-summary` | GET | GPU status summary |
| `/api/v1/nvidia-tech-stack` | GET | Active NVIDIA technologies |
| `/api/v1/guardrails-status` | GET | NeMo Guardrails status |
| `/api/v1/llm-info` | GET | Current LLM provider info |
| `/api/v1/health` | GET | Health check |
| `/api/v1/stats` | GET | Vector store statistics |

---

## 🚀 Deployment

### Frontend (Vercel)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set environment variable:
   - `NEXT_PUBLIC_API_URL`: Your backend URL

### Backend (Railway/Render/Cloud Run)

1. Deploy backend to your preferred platform
2. Set environment variables from `.env.example`
3. Update frontend `NEXT_PUBLIC_API_URL`

---

## 🎯 Features

### ✅ Implemented

- [x] **NVIDIA NIM Integration** - Primary LLM via NVIDIA's inference service
- [x] **NeMo Guardrails** - AI safety with topic control & hallucination prevention
- [x] **GPU Metrics Dashboard** - Real-time monitoring via NVML
- [x] **RAG Pipeline** - Document retrieval with ChromaDB
- [x] **Query Router** - Intelligent routing to specialized handlers
- [x] **Tech Popup System** - Educational popups about NVIDIA technologies
- [x] **Caching System** - Response caching for performance

### 🔮 Planned

- [ ] Triton Inference Server for embeddings
- [ ] NVIDIA Riva for voice interface
- [ ] Milvus with GPU acceleration
- [ ] LangGraph multi-agent architecture
- [ ] Interactive CUDA playground

---

## 📂 Project Structure

```
nvidia-doc-agentic-ai/
├── backend/
│   ├── app/
│   │   ├── api/           # API routes and models
│   │   ├── core/          # Config and logging
│   │   └── services/      # Business logic
│   │       ├── rag_agent.py
│   │       ├── guardrails.py
│   │       ├── gpu_metrics.py
│   │       └── ...
│   ├── guardrails/        # NeMo Guardrails config
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/               # Next.js pages
│   ├── components/        # React components
│   │   ├── ChatInterface.tsx
│   │   ├── GPUDashboard.tsx
│   │   └── NvidiaTechPopup.tsx
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is for demonstration purposes. See individual NVIDIA SDKs for their respective licenses.

---

## 🙏 Acknowledgments

- [NVIDIA NIM](https://developer.nvidia.com/nim)
- [NeMo Guardrails](https://github.com/NVIDIA/NeMo-Guardrails)
- [LangChain](https://langchain.com)
- [ChromaDB](https://trychroma.com)

---

**Built with ❤️ to showcase NVIDIA technology expertise**

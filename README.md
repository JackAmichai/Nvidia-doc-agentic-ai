# NVIDIA Doc Navigator 🚀

[![NVIDIA Technologies](https://img.shields.io/badge/NVIDIA-NIM%20%7C%20CUDA%20%7C%20TensorRT-76B900?style=for-the-badge&logo=nvidia)](https://developer.nvidia.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/JackAmichai/Nvidia-doc-agentic-ai&root-directory=frontend)

A Unified AI Assistant for Navigating NVIDIA Documentation, powered by **NVIDIA NIM** and **DeepSeek R1**.

![NVIDIA Doc Navigator](https://img.shields.io/badge/Powered%20by-DeepSeek%20R1-blue?style=for-the-badge)

---

## 🌟 Features

| Feature | Description |
|---------|-------------|
| 🧠 **NVIDIA NIM** | State-of-the-art LLM inference via DeepSeek R1 |
| ⚡ **Instant Answers** | Get expert guidance on CUDA, TensorRT, MIG, NVLink |
| 📚 **Source Citations** | Links to official NVIDIA documentation |
| 💻 **Code Examples** | References to NVIDIA sample repositories |
| 🎨 **Modern UI** | Clean, responsive chat interface |

---

## 🚀 One-Click Deploy to Vercel

### Step 1: Click the Deploy Button

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/JackAmichai/Nvidia-doc-agentic-ai&root-directory=frontend)

### Step 2: Add Environment Variable

In Vercel's deployment settings, add:

| Variable | Value |
|----------|-------|
| `NVIDIA_API_KEY` | Your key from [build.nvidia.com](https://build.nvidia.com) |

### Step 3: Done! 🎉

Your NVIDIA Doc Navigator is live!

---

## 💻 Local Development

```bash
# Clone the repository
git clone https://github.com/JackAmichai/Nvidia-doc-agentic-ai.git
cd Nvidia-doc-agentic-ai/frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local and add your NVIDIA_API_KEY

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Get Your NVIDIA API Key

1. Go to [build.nvidia.com](https://build.nvidia.com)
2. Sign up or log in
3. Click on any model → "Get API Key"
4. Copy the key starting with `nvapi-`

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│              Vercel (Single Deployment)               │
│  ┌────────────────────────────────────────────────┐  │
│  │               Next.js Frontend                  │  │
│  │  ┌──────────────┐  ┌──────────────────────┐   │  │
│  │  │   Chat UI    │  │  NVIDIA Tech Popups  │   │  │
│  │  └──────────────┘  └──────────────────────┘   │  │
│  └────────────────────────────────────────────────┘  │
│                         │                             │
│  ┌────────────────────────────────────────────────┐  │
│  │            Vercel API Routes                    │  │
│  │  /api/query      → NVIDIA NIM (DeepSeek R1)   │  │
│  │  /api/health     → Health check                │  │
│  │  /api/nvidia-info → Tech stack info           │  │
│  │  /api/gpu-info   → GPU metrics (demo)         │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
                         │
                         ▼
          ┌──────────────────────────┐
          │     NVIDIA NIM API       │
          │   integrate.api.nvidia   │
          │   (DeepSeek R1 Model)    │
          └──────────────────────────┘
```

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/query` | POST | Query the AI assistant |
| `/api/health` | GET | Health check |
| `/api/nvidia-info` | GET | NVIDIA tech stack info |
| `/api/gpu-info` | GET | GPU info (demo data) |

### Query Example

```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "How do I configure MIG on A100?"}'
```

---

## 🎯 Supported Query Types

| Type | Keywords | Example |
|------|----------|---------|
| **MIG Config** | mig, multi-instance, partition | "How to configure MIG?" |
| **CUDA** | cuda, kernel, thread, block | "Why is my CUDA kernel slow?" |
| **Profiling** | nsight, profile, performance | "How to profile CUDA?" |
| **TensorRT** | tensorrt, inference, fp16 | "TensorRT optimization guide" |
| **NVLink** | nvlink, multi-gpu, peer | "Setup NVLink multi-GPU" |
| **NeMo** | nemo, megatron, llm | "NeMo framework tutorial" |
| **Triton** | triton, model serving | "Deploy with Triton" |

---

## 📂 Project Structure

```
nvidia-doc-agentic-ai/
└── frontend/
    ├── app/
    │   ├── api/                    # Serverless API routes
    │   │   ├── query/route.ts      # Main AI query endpoint
    │   │   ├── health/route.ts     # Health check
    │   │   ├── nvidia-info/route.ts # Tech stack info
    │   │   └── gpu-info/route.ts   # GPU metrics (demo)
    │   ├── page.tsx                # Main page
    │   └── layout.tsx              # Root layout
    ├── components/
    │   ├── ChatInterface.tsx       # Chat UI component
    │   ├── NvidiaTechPopup.tsx     # NVIDIA tech popups
    │   └── Header.tsx              # Header component
    ├── package.json
    ├── vercel.json
    └── .env.example
```

---

## 🔧 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NVIDIA_API_KEY` | Yes | - | Your NVIDIA NIM API key |
| `NVIDIA_MODEL` | No | `deepseek-ai/deepseek-r1` | Model to use |
| `NVIDIA_BASE_URL` | No | `https://integrate.api.nvidia.com/v1` | API endpoint |

---

## 🛡️ Security

- API keys are stored as environment variables (never in code)
- `.env.local` is gitignored
- API calls happen server-side (keys not exposed to browser)

---

## 🤝 Contributing

Contributions welcome! Please submit a Pull Request.

---

## 📄 License

MIT License - See individual NVIDIA SDKs for their respective licenses.

---

**Built with ❤️ to showcase NVIDIA technology expertise**

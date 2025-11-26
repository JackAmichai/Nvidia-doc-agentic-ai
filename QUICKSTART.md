# NVIDIA Doc Navigator - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm

### 1. Start the Backend

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at: **http://localhost:8000**
- API Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/api/v1/health

### 2. Start the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at: **http://localhost:3000**

## 📝 Usage

1. Open http://localhost:3000 in your browser
2. Type a question about NVIDIA documentation (e.g., "How do I configure MIG on A100?")
3. Get instant answers with sources!

### Example Queries
- "How do I configure MIG on A100?"
- "Why is my CUDA kernel slow?"
- "TensorRT FP16 optimization example"
- "How to set up NVLink?"

## 🔧 Configuration

### Backend Environment Variables
Create a `.env` file in the `backend/` directory:

```bash
# Optional: For LLM-powered responses
OPENAI_API_KEY=your_openai_api_key_here

# Vector Store
CHROMA_PERSIST_DIRECTORY=./chroma_db
```

## 📚 Adding Documentation

To add NVIDIA documentation to the knowledge base:

```bash
cd backend
source venv/bin/activate
python -c "from app.services.scraper import NVIDIADocScraper; from app.services.vector_store import VectorStoreService; scraper = NVIDIADocScraper(); docs = scraper.scrape_all_sources(); vs = VectorStoreService(); vs.add_documents(docs)"
```

Or use the API endpoint:

```bash
curl -X POST http://localhost:8000/api/v1/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "url": "https://docs.nvidia.com/cuda/",
        "title": "CUDA Documentation",
        "content": "Your content here..."
      }
    ]
  }'
```

## 🧪 Testing

### Test Backend Components
```bash
cd backend
source venv/bin/activate
python test_backend.py
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:8000/api/v1/health

# Query
curl -X POST http://localhost:8000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is CUDA?", "n_results": 5}'

# Stats
curl http://localhost:8000/api/v1/stats
```

## 🎨 Features

### Backend
- ✅ FastAPI REST API
- ✅ RAG (Retrieval-Augmented Generation)
- ✅ ChromaDB Vector Store
- ✅ Query Router (classifies queries by type)
- ✅ Document Scraper for NVIDIA docs
- ✅ Troubleshooting templates

### Frontend
- ✅ Modern, animated UI with glassmorphism
- ✅ Real-time chat interface
- ✅ Source citations
- ✅ Query type detection
- ✅ Example queries
- ✅ Responsive design

## 🐛 Troubleshooting

### Backend won't start
- Make sure virtual environment is activated
- Check Python version: `python --version` (should be 3.8+)
- Reinstall dependencies: `pip install -r requirements.txt`

### Frontend won't start
- Check Node version: `node --version` (should be 18+)
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Can't connect to backend
- Make sure backend is running on port 8000
- Check CORS settings in `backend/app/main.py`
- Verify the API URL in `frontend/components/ChatInterface.tsx`

## 📖 API Documentation

Once the backend is running, visit http://localhost:8000/docs for interactive API documentation.

### Main Endpoints

#### POST `/api/v1/query`
Query the NVIDIA Doc Navigator

**Request:**
```json
{
  "query": "How do I configure MIG?",
  "n_results": 5
}
```

**Response:**
```json
{
  "query": "How do I configure MIG?",
  "answer": "Based on NVIDIA's MIG documentation...",
  "query_type": "mig_config",
  "confidence": 0.85,
  "sources": [...],
  "matched_keywords": ["mig"],
  "suggested_tags": ["mig", "configuration"]
}
```

## 🚢 Deployment

### Backend (Docker)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy to Vercel
vercel deploy
```

## 📄 License

This project is for educational purposes.

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

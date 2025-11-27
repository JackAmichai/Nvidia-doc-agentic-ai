# 🚀 NVIDIA Doc Navigator - Enhanced & Production-Ready

A **Unified AI Assistant** for navigating fragmented NVIDIA documentation, examples, and troubleshooting guides. Built with FastAPI, Next.js, and ChromaDB.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Node 20+](https://img.shields.io/badge/node-20+-green.svg)](https://nodejs.org/)

## ✨ Features

### Core Capabilities
- 🔍 **Unified RAG Search** - Search across NVIDIA docs, CUDA, TensorRT, NeMo, Triton, and more
- 🧠 **Intelligent Query Routing** - Automatically classifies queries (MIG, NVLink, CUDA, etc.)
- 💾 **Smart Caching** - In-memory cache for faster repeated queries
- 🐙 **GitHub Integration** - Fetches code examples from official NVIDIA repositories
- 📚 **Source Citations** - Every answer cites official documentation
- 🎯 **Context-Aware** - Version-specific answers and compatibility checks
- 📊 **Comprehensive Logging** - Full audit trail for debugging and monitoring

### Technical Features
- ⚡ **High Performance** - Sub-second response times with caching
- 🔒 **Production-Ready** - Comprehensive error handling and validation
- 🐳 **Docker Support** - Easy deployment with Docker Compose
- 📈 **Scalable** - Designed for high-traffic scenarios
- 🛠️ **Developer-Friendly** - Full API documentation with Swagger/ReDoc
- 🎨 **Modern UI** - Beautiful, responsive interface with glassmorphism design

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                     │
│  • React Components  • Real-time Chat  • Responsive UI   │
└───────────────────────┬──────────────────────────────────┘
                        │ REST API
┌───────────────────────▼──────────────────────────────────┐
│                   Backend (FastAPI)                       │
│  ┌──────────────┬──────────────┬──────────────────────┐ │
│  │ Query Router │ RAG Agent    │ Cache Service        │ │
│  └──────────────┴──────────────┴──────────────────────┘ │
│  ┌──────────────┬──────────────┬──────────────────────┐ │
│  │ Vector Store │ GitHub API   │ Document Scraper     │ │
│  │  (ChromaDB)  │              │                      │ │
│  └──────────────┴──────────────┴──────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker (optional, for containerized deployment)

### Option 1: Docker (Recommended)

```powershell
# Clone the repository
git clone git@github.com:JackAmichai/Nvidia-doc-agentic-ai.git
cd Nvidia-doc-agentic-ai

# Start services
docker-compose up -d

# Check status
docker-compose ps

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Option 2: Local Development

**Backend Setup:**
```powershell
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example.new .env
# Edit .env with your settings

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend Setup:**
```powershell
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

### Initial Data Ingestion

```powershell
cd backend
python ingest_sample_data.py
```

## 📖 Usage

### Web Interface

1. Open http://localhost:3000
2. Type your question about NVIDIA documentation
3. Get instant answers with source citations and code examples

**Example Queries:**
- "How do I configure MIG on A100?"
- "Why is my CUDA kernel slow?"
- "TensorRT FP16 optimization example"
- "How to set up NVLink between GPUs?"

### API Usage

```python
import requests

# Query the API
response = requests.post("http://localhost:8000/api/v1/query", json={
    "query": "How do I configure MIG on A100?",
    "n_results": 5,
    "include_code_examples": True
})

result = response.json()
print(result["answer"])
```

### cURL Example

```bash
curl -X POST "http://localhost:8000/api/v1/query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do I configure MIG?",
    "n_results": 5,
    "include_code_examples": true
  }'
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Application
DEBUG=false
PROJECT_NAME="NVIDIA Doc Navigator"
PROJECT_VERSION="1.0.0"

# API Keys (optional)
OPENAI_API_KEY=your_openai_key_here
GITHUB_TOKEN=your_github_token_here

# Vector Store
CHROMA_DB_PATH=./chroma_db
COLLECTION_NAME=nvidia_docs

# Cache Configuration
ENABLE_CACHE=true
CACHE_TTL=3600

# Scraper Configuration
SCRAPER_TIMEOUT=10
SCRAPER_RATE_LIMIT=1.0
```

See [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for detailed configuration options.

## 📚 API Documentation

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/query` | POST | Submit a query and get an answer |
| `/api/v1/ingest` | POST | Add documents to the knowledge base |
| `/api/v1/stats` | GET | Get vector store statistics |
| `/api/v1/cache/stats` | GET | Get cache statistics |
| `/api/v1/cache/clear` | POST | Clear the query cache |
| `/api/v1/health` | GET | Health check endpoint |

### Interactive Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🧪 Testing

```powershell
# Run backend tests
cd backend
python test_backend.py

# Test query routing
python -m app.services.query_router

# Test vector store
python -m app.services.vector_store
```

## 📁 Project Structure

```
Nvidia-doc-agentic-ai/
├── backend/
│   ├── app/
│   │   ├── api/              # API routes and models
│   │   ├── core/             # Core configs and logging
│   │   ├── services/         # Business logic
│   │   └── main.py           # FastAPI app
│   ├── logs/                 # Application logs
│   ├── chroma_db/           # Vector database
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/                  # Next.js pages
│   ├── components/           # React components
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── DEVELOPER_GUIDE.md
└── README.md
```

## 🚢 Deployment

### Docker Deployment

```powershell
# Build and deploy
docker-compose up -d --build

# Scale services (if needed)
docker-compose up -d --scale backend=3

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Considerations

- Set `DEBUG=false` in production
- Configure proper CORS origins
- Set up SSL/TLS certificates
- Implement rate limiting
- Set up monitoring and alerting
- Configure log rotation
- Back up the vector database regularly

See [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for complete deployment instructions.

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**
```powershell
# Check if port is in use
netstat -ano | findstr :8000
```

**ChromaDB errors:**
```powershell
# Clear and reinitialize
rm -r backend/chroma_db
python backend/ingest_sample_data.py
```

**Frontend can't connect:**
- Ensure backend is running on port 8000
- Check CORS settings in backend/.env
- Verify firewall settings

### Logs

Logs are stored in `backend/logs/`:
- `app.log` - Main application
- `api.log` - API requests
- `vector_store.log` - Database operations
- `rag_agent.log` - Query processing
- `cache.log` - Cache operations

## 🎯 Roadmap

### Completed ✅
- [x] Unified RAG search system
- [x] Query routing and classification
- [x] Vector store with ChromaDB
- [x] Modern React frontend
- [x] Caching system
- [x] GitHub code search integration
- [x] Comprehensive logging
- [x] Error handling and retries
- [x] Docker support
- [x] API documentation

### Planned 🚧
- [ ] LLM integration (OpenAI/Anthropic)
- [ ] User authentication
- [ ] Query history and favorites
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Slack/Discord bot integration
- [ ] Browser extension

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- NVIDIA for their comprehensive documentation
- ChromaDB for the vector database
- FastAPI for the excellent web framework
- Next.js for the frontend framework

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check the [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
- Review logs in `backend/logs/`

---

**Built with ❤️ for the NVIDIA developer community**

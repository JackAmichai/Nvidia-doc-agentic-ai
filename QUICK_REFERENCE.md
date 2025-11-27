# 🚀 Quick Reference Guide

## Essential Commands

### Start the Application

**Docker (Recommended):**
```powershell
docker-compose up -d
```

**Local Development:**
```powershell
# Terminal 1 - Backend
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Access Points
- **Frontend**: http://localhost:3000
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Quick Reference

### Query Endpoint
```bash
curl -X POST http://localhost:8000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do I configure MIG?",
    "n_results": 5,
    "include_code_examples": true
  }'
```

### Health Check
```bash
curl http://localhost:8000/api/v1/health
```

### Cache Stats
```bash
curl http://localhost:8000/api/v1/cache/stats
```

### Clear Cache
```bash
curl -X POST http://localhost:8000/api/v1/cache/clear
```

### Vector Store Stats
```bash
curl http://localhost:8000/api/v1/stats
```

## Configuration

### Key Environment Variables

```env
# Essential
DEBUG=false
ENABLE_CACHE=true
CACHE_TTL=3600

# Optional (for better features)
GITHUB_TOKEN=your_token_here
OPENAI_API_KEY=your_key_here
```

### Configuration File Location
`backend/.env`

## Troubleshooting

### Backend Issues
```powershell
# Check logs
cat backend/logs/app.log

# Check if running
netstat -ano | findstr :8000

# Restart backend
docker-compose restart backend
```

### Frontend Issues
```powershell
# Check if running
netstat -ano | findstr :3000

# Restart frontend
docker-compose restart frontend
```

### Database Issues
```powershell
# Clear and reinitialize
rm -r backend/chroma_db
python backend/ingest_sample_data.py
```

## Common Tasks

### Add New Documents
```python
import requests

requests.post("http://localhost:8000/api/v1/ingest", json={
    "documents": [
        {
            "url": "https://docs.nvidia.com/...",
            "title": "Document Title",
            "content": "Content here...",
            "source": "nvidia_docs"
        }
    ]
})
```

### Check System Status
```bash
curl http://localhost:8000/api/v1/health
```

### View Logs
```powershell
# All logs
ls backend/logs/

# Main app log
cat backend/logs/app.log

# API requests
cat backend/logs/api.log

# Docker logs
docker-compose logs -f backend
```

## File Locations

### Logs
```
backend/logs/
├── app.log              # Main application
├── api.log              # API requests
├── vector_store.log     # Database operations
├── rag_agent.log        # Query processing
├── cache.log            # Cache operations
├── github_search.log    # GitHub API calls
└── scraper.log          # Document scraping
```

### Data
```
backend/chroma_db/       # Vector database
backend/.env             # Configuration
```

### Code
```
backend/app/
├── api/                 # API layer
├── core/                # Configuration
└── services/            # Business logic

frontend/
├── app/                 # Next.js pages
└── components/          # React components
```

## Performance Tips

1. **Enable Caching**: Set `ENABLE_CACHE=true`
2. **Use GitHub Token**: Avoid rate limits
3. **Adjust Cache TTL**: Longer for stable docs
4. **Reduce n_results**: Faster queries
5. **Use Docker**: Consistent performance

## Monitoring

### Check Cache Performance
```bash
curl http://localhost:8000/api/v1/cache/stats
```

**Response:**
```json
{
  "enabled": true,
  "total_entries": 42,
  "active_entries": 38,
  "expired_entries": 4,
  "ttl_seconds": 3600
}
```

### Check System Health
```bash
curl http://localhost:8000/api/v1/health
```

**Response:**
```json
{
  "status": "healthy",
  "message": "NVIDIA Doc Navigator API is running",
  "version": "1.0.0",
  "documents_count": 150
}
```

## Example Queries

### MIG Configuration
```
"How do I configure MIG on A100?"
```

### CUDA Performance
```
"Why is my CUDA kernel slow?"
```

### TensorRT Optimization
```
"TensorRT FP16 optimization example"
```

### NVLink Setup
```
"How to set up NVLink between GPUs?"
```

## Useful Links

- **API Documentation**: http://localhost:8000/docs
- **Developer Guide**: [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
- **Changelog**: [CHANGELOG.md](./CHANGELOG.md)
- **Enhancements**: [ENHANCEMENTS_SUMMARY.md](./ENHANCEMENTS_SUMMARY.md)

## Emergency Commands

### Stop Everything
```powershell
docker-compose down
```

### Reset Everything
```powershell
docker-compose down -v
rm -r backend/chroma_db
rm -r backend/logs
docker-compose up -d --build
python backend/ingest_sample_data.py
```

### View All Logs
```powershell
docker-compose logs -f
```

## Support

1. Check logs in `backend/logs/`
2. Review [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
3. Check health endpoint
4. Review configuration in `.env`

---

**Pro Tip**: Keep this file handy for quick reference! 📌

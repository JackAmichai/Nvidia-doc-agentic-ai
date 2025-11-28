# 🚀 Quick Start Guide - NVIDIA Doc Navigator

## Prerequisites
- Python 3.10+
- Node.js 18+
- A Hugging Face account (free) OR OpenAI API key

---

## Step 1: Get a Free Hugging Face API Token

1. Visit https://huggingface.co/settings/tokens
2. Sign up or log in
3. Click **"New token"**
4. Give it a name (e.g., "nvidia-doc-navigator")
5. Select **"Read"** access
6. Copy the token

---

## Step 2: Configure Backend

```bash
cd backend

# Copy the example env file
cp .env.example .env

# Edit .env and paste your Hugging Face token
# nano .env  # or use any text editor
# Set: HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxx
```

---

## Step 3: Install Backend Dependencies

```bash
# Create virtual environment (if not already created)
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # Mac/Linux
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt
```

---

## Step 4: Ingest Sample Data

```bash
# This will scrape NVIDIA docs and populate the vector database
python ingest_data.py
```

Expected output:
```
Starting NVIDIA Documentation Ingestion...
Scraping documentation sources...
Scraped 4 documents.
Ingesting into Vector Store (ChromaDB)...
Successfully ingested 4 documents!
```

---

## Step 5: Start the Backend

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Keep this terminal open!**

---

## Step 6: Start the Frontend

Open a **new terminal**:

```bash
cd frontend

# Install dependencies (if not already installed)
npm install

# Start development server
npm run dev
```

You should see:
```
➜ Local: http://localhost:3000
```

---

## Step 7: Test the Application

1. Open your browser to **http://localhost:3000**
2. You'll see the beautiful NVIDIA Doc Navigator interface
3. Try a sample query:
   - "How do I configure MIG on A100?"
   - "Why is my CUDA kernel slow?"
   - "TensorRT FP16 optimization guide"

---

## 🎉 You're All Set!

The system is now:
- ✅ Connected to Hugging Face (Free LLM)
- ✅ Using RAG with ChromaDB
- ✅ Routing queries intelligently
- ✅ Providing version compatibility checks
- ✅ Offering step-by-step debugging

---

## Troubleshooting

### Backend won't start
- Check that port 8000 is not in use: `lsof -i :8000`
- Make sure virtual environment is activated
- Verify .env file has your API key

### Frontend won't connect
- Ensure backend is running on port 8000
- Check browser console for CORS errors
- Verify frontend is running on port 3000

### No results returned
- Run `python ingest_data.py` to populate the database
- Check logs in `backend/*.log` files

---

## Advanced: Using OpenAI Instead

If you prefer OpenAI (requires payment):

1. Get API key from https://platform.openai.com/api-keys
2. Edit `backend/.env`:
   ```
   OPENAI_API_KEY=sk-xxxxxxxxxxxxx
   # Comment out or leave blank:
   # HUGGINGFACE_API_KEY=
   ```
3. Restart the backend

The system will automatically use OpenAI if the key is present.

---

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── core/         # Configuration
│   │   └── services/     # RAG, routing, scraping
│   ├── .env              # Your API keys (DO NOT COMMIT)
│   └── requirements.txt
├── frontend/
│   ├── app/              # Next.js pages
│   ├── components/       # React components
│   └── package.json
└── README.md
```

---

**Questions?** Check the logs or STATUS.md for more details!

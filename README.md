# NVIDIA Doc Navigator

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
```
OPENAI_API_KEY=your_key
```

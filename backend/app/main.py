from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="NVIDIA Doc Navigator API",
    description="API for the NVIDIA Doc Navigator AI Assistant",
    version="1.0.0"
)

# CORS Configuration
origins = [
    "http://localhost:3000",  # Next.js frontend
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to NVIDIA Doc Navigator API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

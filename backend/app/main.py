from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router

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

# Include API routes
app.include_router(api_router, prefix="/api/v1", tags=["api"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to NVIDIA Doc Navigator API",
        "version": "1.0.0",
        "docs": "/docs"
    }

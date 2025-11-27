from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router
from app.core.config import settings
from app.core.logger import setup_logger

logger = setup_logger(__name__, "main.log")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for the NVIDIA Doc Navigator AI Assistant - A unified AI assistant for navigating fragmented NVIDIA documentation",
    version=settings.PROJECT_VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info(f"Starting {settings.PROJECT_NAME} v{settings.PROJECT_VERSION}")

# Include API routes
app.include_router(api_router, prefix="/api/v1", tags=["api"])

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "version": settings.PROJECT_VERSION,
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/api/v1/health"
    }


@app.on_event("startup")
async def startup_event():
    """Log startup event."""
    logger.info("Application startup complete")
    logger.info(f"Debug mode: {settings.DEBUG}")
    logger.info(f"Cache enabled: {settings.ENABLE_CACHE}")


@app.on_event("shutdown")
async def shutdown_event():
    """Log shutdown event."""
    logger.info("Application shutting down")

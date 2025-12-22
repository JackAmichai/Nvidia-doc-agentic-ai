"""
API Routes
"""

from fastapi import APIRouter, HTTPException, status
from app.api.models import (
    QueryRequest, QueryResponse, 
    IngestRequest, IngestResponse,
    StatsResponse, HealthResponse, CacheStatsResponse
)
from app.services.vector_store import VectorStoreService
from app.services.rag_agent import RAGAgent
from app.services.cache import cache_service
from app.services.gpu_metrics import gpu_metrics_service
from app.services.guardrails import guardrails_service
from app.core.logger import setup_logger
from app.core.config import settings

logger = setup_logger(__name__, "api.log")
router = APIRouter()

# Initialize services (in production, use dependency injection)
try:
    vector_store = VectorStoreService()
    # Enable LLM if API key is present
    use_llm = bool(settings.NVIDIA_API_KEY or settings.OPENAI_API_KEY or settings.HUGGINGFACE_API_KEY)
    rag_agent = RAGAgent(vector_store, use_llm=use_llm)
    logger.info(f"API services initialized successfully (LLM enabled: {use_llm})")
except Exception as e:
    logger.error(f"Failed to initialize API services: {str(e)}")
    raise


@router.post("/query", response_model=QueryResponse)
async def query_endpoint(request: QueryRequest):
    """
    Query the NVIDIA Doc Navigator.
    
    This endpoint accepts a user query and returns an AI-generated answer
    based on NVIDIA documentation.
    """
    try:
        logger.info(f"Received query request: '{request.query[:100]}...'")
        
        if not request.query or not request.query.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Query cannot be empty"
            )
        
        result = rag_agent.query(
            request.query, 
            n_results=request.n_results,
            include_code_examples=request.include_code_examples
        )
        
        logger.info("Query processed successfully")
        return QueryResponse(**result)
        
    except ValueError as e:
        logger.warning(f"Invalid query request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except RuntimeError as e:
        logger.error(f"Runtime error processing query: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your query. Please try again."
        )
    except Exception as e:
        logger.error(f"Unexpected error processing query: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again later."
        )


@router.post("/ingest", response_model=IngestResponse)
async def ingest_documents(request: IngestRequest):
    """
    Ingest documents into the vector store.
    
    This endpoint allows adding new documents to the knowledge base.
    """
    try:
        logger.info(f"Received ingest request for {len(request.documents)} documents")
        
        if not request.documents:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No documents provided"
            )
        
        documents = [doc.model_dump() for doc in request.documents]
        count = vector_store.add_documents(documents)
        
        # Clear cache after ingesting new documents
        cache_service.clear()
        logger.info("Cache cleared after document ingestion")
        
        return IngestResponse(
            success=True,
            documents_added=count,
            message=f"Successfully added {count} documents"
        )
        
    except ValueError as e:
        logger.warning(f"Invalid ingest request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error ingesting documents: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to ingest documents. Please check your data and try again."
        )


@router.get("/stats", response_model=StatsResponse)
async def get_stats():
    """
    Get vector store statistics.
    """
    try:
        stats = vector_store.get_collection_stats()
        return StatsResponse(**stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting stats: {str(e)}")


@router.get("/cache/stats", response_model=CacheStatsResponse)
async def get_cache_stats():
    """
    Get cache statistics.
    """
    try:
        stats = cache_service.get_stats()
        return CacheStatsResponse(**stats)
    except Exception as e:
        logger.error(f"Error getting cache stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve cache statistics"
        )


@router.post("/cache/clear")
async def clear_cache():
    """
    Clear the query cache.
    """
    try:
        cache_service.clear()
        logger.info("Cache cleared via API")
        return {"success": True, "message": "Cache cleared successfully"}
    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear cache"
        )


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.
    """
    try:
        # Check if services are responsive
        stats = vector_store.get_collection_stats()
        
        return HealthResponse(
            status="healthy",
            message="NVIDIA Doc Navigator API is running",
            version=settings.PROJECT_VERSION,
            documents_count=stats['total_documents']
        )
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return HealthResponse(
            status="degraded",
            message=f"API is running but some services may be unavailable: {str(e)}",
            version=settings.PROJECT_VERSION
        )


@router.get("/gpu-info")
async def get_gpu_info():
    """
    Get GPU information and metrics using NVIDIA NVML.
    
    Returns real-time GPU utilization, memory, temperature, and MIG status.
    """
    try:
        gpu_info = gpu_metrics_service.get_all_gpu_info()
        return gpu_info
    except Exception as e:
        logger.error(f"Error getting GPU info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve GPU information: {str(e)}"
        )


@router.get("/gpu-summary")
async def get_gpu_summary():
    """
    Get a quick summary of GPU status.
    """
    try:
        return gpu_metrics_service.get_gpu_summary()
    except Exception as e:
        logger.error(f"Error getting GPU summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve GPU summary"
        )


@router.get("/guardrails-status")
async def get_guardrails_status():
    """
    Get NeMo Guardrails status and configuration.
    """
    try:
        return guardrails_service.get_status()
    except Exception as e:
        logger.error(f"Error getting guardrails status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve guardrails status"
        )


@router.get("/llm-info")
async def get_llm_info():
    """
    Get information about the current LLM provider.
    """
    try:
        return rag_agent.get_llm_info()
    except Exception as e:
        logger.error(f"Error getting LLM info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve LLM information"
        )


@router.get("/nvidia-tech-stack")
async def get_nvidia_tech_stack():
    """
    Get information about all NVIDIA technologies used in the application.
    """
    try:
        llm_info = rag_agent.get_llm_info()
        gpu_summary = gpu_metrics_service.get_gpu_summary()
        guardrails_status = guardrails_service.get_status()
        
        return {
            "nvidia_technologies": {
                "nim": {
                    "name": "NVIDIA NIM",
                    "active": llm_info.get("is_nvidia", False),
                    "model": llm_info.get("model") if llm_info.get("is_nvidia") else None,
                    "description": "NVIDIA Inference Microservices for optimized LLM inference"
                },
                "nemo_guardrails": {
                    "name": "NeMo Guardrails",
                    "active": guardrails_status.get("enabled", False),
                    "description": "AI safety rails for preventing hallucinations and off-topic responses"
                },
                "nvml": {
                    "name": "NVIDIA Management Library",
                    "active": not gpu_summary.get("mock_data", True),
                    "gpu_count": gpu_summary.get("gpu_count", 0),
                    "description": "Real-time GPU monitoring and management"
                },
                "cuda": {
                    "name": "NVIDIA CUDA",
                    "active": True,
                    "description": "Parallel computing platform powering GPU acceleration"
                }
            },
            "llm_provider": llm_info,
            "gpu_summary": gpu_summary,
            "guardrails": guardrails_status
        }
    except Exception as e:
        logger.error(f"Error getting NVIDIA tech stack: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve NVIDIA technology stack information"
        )

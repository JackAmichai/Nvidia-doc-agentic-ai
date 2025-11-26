"""
API Routes
"""

from fastapi import APIRouter, HTTPException
from app.api.models import (
    QueryRequest, QueryResponse, 
    IngestRequest, IngestResponse,
    StatsResponse, HealthResponse
)
from app.services.vector_store import VectorStoreService
from app.services.rag_agent import RAGAgent

router = APIRouter()

# Initialize services (in production, use dependency injection)
vector_store = VectorStoreService()
rag_agent = RAGAgent(vector_store, use_llm=False)


@router.post("/query", response_model=QueryResponse)
async def query_endpoint(request: QueryRequest):
    """
    Query the NVIDIA Doc Navigator.
    
    This endpoint accepts a user query and returns an AI-generated answer
    based on NVIDIA documentation.
    """
    try:
        result = rag_agent.query(request.query, n_results=request.n_results)
        return QueryResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")


@router.post("/ingest", response_model=IngestResponse)
async def ingest_documents(request: IngestRequest):
    """
    Ingest documents into the vector store.
    
    This endpoint allows adding new documents to the knowledge base.
    """
    try:
        documents = [doc.model_dump() for doc in request.documents]
        vector_store.add_documents(documents)
        
        return IngestResponse(
            success=True,
            documents_added=len(documents),
            message=f"Successfully added {len(documents)} documents"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error ingesting documents: {str(e)}")


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


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.
    """
    return HealthResponse(
        status="healthy",
        message="NVIDIA Doc Navigator API is running"
    )

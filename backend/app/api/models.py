"""
API Models (Pydantic schemas)
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict


class QueryRequest(BaseModel):
    """Request model for queries."""
    query: str = Field(..., description="User's question")
    n_results: int = Field(5, description="Number of results to retrieve", ge=1, le=20)


class Source(BaseModel):
    """Source document metadata."""
    title: str
    url: str
    relevance: float = Field(..., ge=0.0, le=1.0)


class QueryResponse(BaseModel):
    """Response model for queries."""
    query: str
    answer: str
    query_type: str
    confidence: float
    sources: List[Source]
    matched_keywords: List[str]
    suggested_tags: List[str]


class DocumentInput(BaseModel):
    """Model for adding documents."""
    url: str
    title: str
    content: str
    source: Optional[str] = "manual"


class IngestRequest(BaseModel):
    """Request to ingest documents."""
    documents: List[DocumentInput]


class IngestResponse(BaseModel):
    """Response for document ingestion."""
    success: bool
    documents_added: int
    message: str


class StatsResponse(BaseModel):
    """Vector store statistics."""
    total_documents: int
    collection_name: str


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    message: str

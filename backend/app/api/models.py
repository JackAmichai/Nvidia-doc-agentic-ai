"""
API Models (Pydantic schemas)
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict


class QueryRequest(BaseModel):
    """Request model for queries."""
    query: str = Field(..., description="User's question", min_length=1)
    n_results: int = Field(5, description="Number of results to retrieve", ge=1, le=20)
    include_code_examples: bool = Field(True, description="Whether to include code examples from GitHub")


class Source(BaseModel):
    """Source document metadata."""
    title: str
    url: str
    relevance: float = Field(..., ge=0.0, le=1.0)


class CodeExample(BaseModel):
    """Code example from GitHub."""
    name: str
    path: str
    repo: str
    url: str
    description: str


class QueryResponse(BaseModel):
    """Response model for queries."""
    query: str
    answer: str
    query_type: str
    confidence: float
    sources: List[Source]
    code_examples: List[CodeExample] = []
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


class CacheStatsResponse(BaseModel):
    """Cache statistics response."""
    enabled: bool
    total_entries: int
    active_entries: int
    expired_entries: int
    ttl_seconds: int


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    message: str
    version: Optional[str] = None
    documents_count: Optional[int] = None

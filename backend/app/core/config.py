"""
Application configuration.
"""

from pydantic_settings import BaseSettings
from pydantic import Field, validator
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings with validation."""
    
    # API Configuration
    PROJECT_NAME: str = "NVIDIA Doc Navigator"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = Field(default=False, description="Enable debug mode")
    
    # LLM API Keys (optional for MVP)
    OPENAI_API_KEY: Optional[str] = Field(default=None, description="OpenAI API key for LLM")
    ANTHROPIC_API_KEY: Optional[str] = Field(default=None, description="Anthropic API key for Claude")
    HUGGINGFACE_API_KEY: Optional[str] = Field(default=None, description="Hugging Face API Token")
    HUGGINGFACE_REPO_ID: str = Field(default="mistralai/Mistral-7B-Instruct-v0.2", description="Hugging Face Model ID")
    
    # Vector Store Configuration
    CHROMA_DB_PATH: str = Field(default="./chroma_db", description="Path to ChromaDB storage")
    COLLECTION_NAME: str = Field(default="nvidia_docs", description="ChromaDB collection name")
    
    # RAG Configuration
    DEFAULT_N_RESULTS: int = Field(default=5, ge=1, le=20, description="Default number of search results")
    MAX_CONTENT_LENGTH: int = Field(default=2000, description="Max content length for context")
    
    # Scraper Configuration
    SCRAPER_TIMEOUT: int = Field(default=10, ge=1, le=60, description="Scraper request timeout in seconds")
    SCRAPER_RATE_LIMIT: float = Field(default=1.0, ge=0.1, description="Rate limit between requests")
    
    # Cache Configuration
    ENABLE_CACHE: bool = Field(default=True, description="Enable query caching")
    CACHE_TTL: int = Field(default=3600, ge=60, description="Cache TTL in seconds")
    
    # CORS Configuration
    CORS_ORIGINS: list[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"],
        description="Allowed CORS origins"
    )
    
    @validator("CHROMA_DB_PATH")
    def validate_db_path(cls, v):
        """Ensure the database path is valid."""
        os.makedirs(v, exist_ok=True)
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

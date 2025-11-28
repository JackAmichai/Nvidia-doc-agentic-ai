"""
Data Ingestion Script
Scrapes NVIDIA documentation and ingests it into the vector store.
"""

import asyncio
import sys
import os

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.scraper import NVIDIADocScraper
from app.services.vector_store import VectorStoreService
from app.core.logger import setup_logger

logger = setup_logger(__name__, "ingest.log")

def ingest_data():
    """Run the ingestion pipeline."""
    print("Starting NVIDIA Documentation Ingestion...")
    logger.info("Starting ingestion process")
    
    # Initialize services
    scraper = NVIDIADocScraper()
    vector_store = VectorStoreService()
    
    # Scrape documents
    # In a real scenario, we would scrape hundreds of pages.
    # For this demo, we'll scrape a few key pages from each source.
    print("Scraping documentation sources...")
    documents = scraper.scrape_all_sources(max_pages_per_source=5)
    
    if not documents:
        print("No documents scraped. Check internet connection or scraper logic.")
        return
    
    print(f"Scraped {len(documents)} documents.")
    
    # Ingest into Vector Store
    print("Ingesting into Vector Store (ChromaDB)...")
    count = vector_store.add_documents(documents)
    
    print(f"Successfully ingested {count} documents!")
    logger.info(f"Ingestion complete. Added {count} documents.")

if __name__ == "__main__":
    ingest_data()

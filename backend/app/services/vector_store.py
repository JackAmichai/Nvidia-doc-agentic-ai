"""
Vector Store Service
Manages ChromaDB for RAG retrieval.
"""

import chromadb
from chromadb.config import Settings
from typing import List, Dict, Optional
import os
from app.core.logger import setup_logger
from app.core.config import settings as app_settings

logger = setup_logger(__name__, "vector_store.log")


class VectorStoreService:
    """Service for managing vector embeddings and retrieval."""
    
    def __init__(self, persist_directory: str = None):
        """Initialize ChromaDB client."""
        self.persist_directory = persist_directory or app_settings.CHROMA_DB_PATH
        
        try:
            # Create directory if it doesn't exist
            os.makedirs(self.persist_directory, exist_ok=True)
            logger.info(f"Using ChromaDB at: {self.persist_directory}")
            
            # Initialize ChromaDB client
            self.client = chromadb.PersistentClient(path=self.persist_directory)
            
            # Get or create collection
            self.collection = self.client.get_or_create_collection(
                name=app_settings.COLLECTION_NAME,
                metadata={"description": "NVIDIA Documentation for RAG"}
            )
            logger.info(f"Collection '{app_settings.COLLECTION_NAME}' initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB: {str(e)}")
            raise RuntimeError(f"Vector store initialization failed: {str(e)}")
    
    def add_documents(self, documents: List[Dict[str, str]]) -> int:
        """
        Add documents to the vector store.
        
        Args:
            documents: List of dicts with 'content', 'url', 'title' keys
            
        Returns:
            Number of documents successfully added
        """
        if not documents:
            logger.warning("No documents to add")
            return 0
        
        try:
            # Validate documents
            for doc in documents:
                if not all(key in doc for key in ['content', 'url', 'title']):
                    raise ValueError("Each document must have 'content', 'url', and 'title' keys")
            
            # Prepare data for ChromaDB
            ids = []
            texts = []
            metadatas = []
            
            for i, doc in enumerate(documents):
                doc_id = f"doc_{i}_{abs(hash(doc['url']))}"
                ids.append(doc_id)
                texts.append(doc['content'])
                metadatas.append({
                    "url": doc['url'],
                    "title": doc['title'],
                    "source": doc.get('source', 'nvidia_docs')
                })
            
            # Add to collection
            self.collection.add(
                ids=ids,
                documents=texts,
                metadatas=metadatas
            )
            
            logger.info(f"Successfully added {len(documents)} documents to vector store")
            return len(documents)
            
        except Exception as e:
            logger.error(f"Error adding documents to vector store: {str(e)}")
            raise ValueError(f"Failed to add documents: {str(e)}")
    
    def search(self, query: str, n_results: int = 5) -> List[Dict]:
        """
        Search for relevant documents.
        
        Args:
            query: Search query
            n_results: Number of results to return
            
        Returns:
            List of relevant documents with metadata
        """
        if not query or not query.strip():
            logger.warning("Empty query provided to search")
            return []
        
        try:
            logger.info(f"Searching for: '{query[:50]}...' (n_results={n_results})")
            
            results = self.collection.query(
                query_texts=[query],
                n_results=min(n_results, 20)  # Cap at 20 for safety
            )
            
            # Format results
            formatted_results = []
            
            if results['documents'] and results['documents'][0]:
                for i in range(len(results['documents'][0])):
                    formatted_results.append({
                        "content": results['documents'][0][i],
                        "metadata": results['metadatas'][0][i] if results['metadatas'] else {},
                        "distance": results['distances'][0][i] if results['distances'] else None
                    })
            
            logger.info(f"Found {len(formatted_results)} relevant documents")
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error searching vector store: {str(e)}")
            raise RuntimeError(f"Search failed: {str(e)}")
    
    def get_collection_stats(self) -> Dict:
        """Get statistics about the collection."""
        count = self.collection.count()
        return {
            "total_documents": count,
            "collection_name": self.collection.name
        }
    
    def clear_collection(self) -> None:
        """Clear all documents from the collection."""
        self.client.delete_collection(name="nvidia_docs")
        self.collection = self.client.get_or_create_collection(
            name="nvidia_docs",
            metadata={"description": "NVIDIA Documentation for RAG"}
        )
        print("Collection cleared")


if __name__ == "__main__":
    # Test the vector store
    vector_store = VectorStoreService()
    
    # Test documents
    test_docs = [
        {
            "url": "https://docs.nvidia.com/cuda/test",
            "title": "CUDA Programming Guide",
            "content": "CUDA is a parallel computing platform and programming model."
        },
        {
            "url": "https://docs.nvidia.com/tensorrt/test",
            "title": "TensorRT Guide",
            "content": "TensorRT is a high-performance deep learning inference optimizer."
        }
    ]
    
    vector_store.add_documents(test_docs)
    
    # Test search
    results = vector_store.search("What is CUDA?", n_results=2)
    print("\nSearch results:")
    for result in results:
        print(f"\nTitle: {result['metadata'].get('title', 'N/A')}")
        print(f"Content: {result['content'][:100]}...")
    
    # Stats
    stats = vector_store.get_collection_stats()
    print(f"\nCollection stats: {stats}")

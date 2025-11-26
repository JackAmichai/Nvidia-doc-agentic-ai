"""
Vector Store Service
Manages ChromaDB for RAG retrieval.
"""

import chromadb
from chromadb.config import Settings
from typing import List, Dict, Optional
import os


class VectorStoreService:
    """Service for managing vector embeddings and retrieval."""
    
    def __init__(self, persist_directory: str = "./chroma_db"):
        """Initialize ChromaDB client."""
        self.persist_directory = persist_directory
        
        # Create directory if it doesn't exist
        os.makedirs(persist_directory, exist_ok=True)
        
        # Initialize ChromaDB client
        self.client = chromadb.PersistentClient(path=persist_directory)
        
        # Get or create collection
        self.collection = self.client.get_or_create_collection(
            name="nvidia_docs",
            metadata={"description": "NVIDIA Documentation for RAG"}
        )
    
    def add_documents(self, documents: List[Dict[str, str]]) -> None:
        """
        Add documents to the vector store.
        
        Args:
            documents: List of dicts with 'content', 'url', 'title' keys
        """
        if not documents:
            print("No documents to add")
            return
        
        # Prepare data for ChromaDB
        ids = []
        texts = []
        metadatas = []
        
        for i, doc in enumerate(documents):
            doc_id = f"doc_{i}_{hash(doc['url'])}"
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
        
        print(f"Added {len(documents)} documents to vector store")
    
    def search(self, query: str, n_results: int = 5) -> List[Dict]:
        """
        Search for relevant documents.
        
        Args:
            query: Search query
            n_results: Number of results to return
            
        Returns:
            List of relevant documents with metadata
        """
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
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
        
        return formatted_results
    
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

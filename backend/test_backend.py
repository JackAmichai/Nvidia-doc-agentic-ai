"""
Simple test script to verify backend components work.
"""

import sys
sys.path.insert(0, '/Users/jackamichai/Documents/antigravity projects/backend')

from app.services.query_router import QueryRouter, QueryType

def test_query_router():
    """Test the query router."""
    print("="*80)
    print("Testing Query Router")
    print("="*80)
    
    router = QueryRouter()
    
    test_queries = [
        "Why is my MIG instance not visible in Kubernetes?",
        "How do I configure NVLink on A100?",
        "TensorRT FP16 optimization example",
        "Why is my CUDA kernel slow?",
    ]
    
    for query in test_queries:
        result = router.route_query(query)
        print(f"\nQuery: {query}")
        print(f"  Type: {result['query_type'].value}")
        print(f"  Confidence: {result['confidence']:.2f}")
        print(f"  Keywords: {', '.join(result['matched_keywords'])}")

if __name__ == "__main__":
    test_query_router()
    print("\n✅ Query Router test passed!")

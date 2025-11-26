"""
Query Router
Routes user queries to the appropriate module/handler.
"""

from typing import Dict, List
from enum import Enum


class QueryType(Enum):
    """Types of queries the system can handle."""
    MIG_CONFIG = "mig_config"
    NVLINK = "nvlink"
    TENSORRT = "tensorrt"
    NEMO = "nemo"
    TRITON = "triton"
    CUDA_GENERAL = "cuda_general"
    CUDA_PROFILING = "cuda_profiling"
    GENERIC = "generic"


class QueryRouter:
    """Routes queries to appropriate handlers based on keywords and context."""
    
    def __init__(self):
        # Define keyword patterns for each query type
        self.routing_patterns = {
            QueryType.MIG_CONFIG: [
                "mig", "multi-instance", "gpu partitioning", "mig mode",
                "gpu instance", "compute instance"
            ],
            QueryType.NVLINK: [
                "nvlink", "nv-link", "gpu interconnect", "peer-to-peer",
                "p2p", "gpu communication"
            ],
            QueryType.TENSORRT: [
                "tensorrt", "trt", "inference optimization", "fp16", "int8",
                "inference engine", "onnx"
            ],
            QueryType.NEMO: [
                "nemo", "llm", "language model", "asr", "speech recognition",
                "conversational ai"
            ],
            QueryType.TRITON: [
                "triton", "inference server", "model serving", "deployment",
                "triton server"
            ],
            QueryType.CUDA_PROFILING: [
                "nsight", "profiling", "profiler", "performance analysis",
                "kernel slow", "optimization", "bottleneck"
            ],
            QueryType.CUDA_GENERAL: [
                "cuda", "kernel", "thread", "block", "grid", "device",
                "host", "memory", "shared memory", "global memory"
            ]
        }
    
    def route_query(self, query: str) -> Dict[str, any]:
        """
        Route a query to the appropriate handler.
        
        Args:
            query: User query string
            
        Returns:
            Dict with query_type, confidence, and matched_keywords
        """
        query_lower = query.lower()
        
        # Score each query type
        scores = {}
        matched_keywords = {}
        
        for query_type, keywords in self.routing_patterns.items():
            score = 0
            matches = []
            
            for keyword in keywords:
                if keyword in query_lower:
                    score += 1
                    matches.append(keyword)
            
            if score > 0:
                scores[query_type] = score
                matched_keywords[query_type] = matches
        
        # Determine the best match
        if not scores:
            return {
                "query_type": QueryType.GENERIC,
                "confidence": 0.0,
                "matched_keywords": [],
                "suggested_tags": ["general", "nvidia"]
            }
        
        # Get the query type with highest score
        best_match = max(scores.items(), key=lambda x: x[1])
        query_type, score = best_match
        
        # Calculate confidence (simple heuristic)
        max_possible_score = len(self.routing_patterns[query_type])
        confidence = min(score / max_possible_score, 1.0)
        
        return {
            "query_type": query_type,
            "confidence": confidence,
            "matched_keywords": matched_keywords[query_type],
            "suggested_tags": self._get_tags_for_type(query_type)
        }
    
    def _get_tags_for_type(self, query_type: QueryType) -> List[str]:
        """Get relevant tags for a query type."""
        tag_mapping = {
            QueryType.MIG_CONFIG: ["mig", "configuration", "multi-instance"],
            QueryType.NVLINK: ["nvlink", "interconnect", "p2p"],
            QueryType.TENSORRT: ["tensorrt", "inference", "optimization"],
            QueryType.NEMO: ["nemo", "llm", "ai"],
            QueryType.TRITON: ["triton", "inference-server", "deployment"],
            QueryType.CUDA_PROFILING: ["cuda", "profiling", "performance"],
            QueryType.CUDA_GENERAL: ["cuda", "programming", "gpu"],
            QueryType.GENERIC: ["nvidia", "general"]
        }
        
        return tag_mapping.get(query_type, ["nvidia"])
    
    def get_search_filters(self, query_type: QueryType) -> Dict[str, List[str]]:
        """
        Get search filters for a specific query type.
        This can be used to filter vector store results.
        """
        filter_mapping = {
            QueryType.MIG_CONFIG: {
                "sources": ["mig-user-guide", "datacenter-docs"],
                "topics": ["mig", "configuration"]
            },
            QueryType.NVLINK: {
                "sources": ["nvlink-docs", "datacenter-docs"],
                "topics": ["nvlink", "interconnect"]
            },
            QueryType.TENSORRT: {
                "sources": ["tensorrt-docs", "deeplearning-docs"],
                "topics": ["tensorrt", "inference"]
            },
            QueryType.CUDA_GENERAL: {
                "sources": ["cuda-docs", "cuda-programming-guide"],
                "topics": ["cuda", "programming"]
            }
        }
        
        return filter_mapping.get(query_type, {"sources": [], "topics": []})


if __name__ == "__main__":
    # Test the router
    router = QueryRouter()
    
    test_queries = [
        "Why is my MIG instance not visible in Kubernetes?",
        "How do I configure NVLink on A100?",
        "TensorRT FP16 optimization example",
        "Deploy NeMo LLM on Triton",
        "Why is my CUDA kernel slow?",
        "What is CUDA?"
    ]
    
    print("Query Routing Test\n" + "="*80)
    
    for query in test_queries:
        result = router.route_query(query)
        print(f"\nQuery: {query}")
        print(f"Type: {result['query_type'].value}")
        print(f"Confidence: {result['confidence']:.2f}")
        print(f"Matched Keywords: {', '.join(result['matched_keywords'])}")
        print(f"Tags: {', '.join(result['suggested_tags'])}")

"""
RAG Agent Service
Main agent that orchestrates RAG retrieval and answer generation.
"""

from typing import List, Dict, Optional
from app.services.vector_store import VectorStoreService
from app.services.query_router import QueryRouter, QueryType
from app.services.cache import cache_service
from app.services.github_search import github_service
from app.core.logger import setup_logger

logger = setup_logger(__name__, "rag_agent.log")


class RAGAgent:
    """Main RAG agent for answering NVIDIA documentation queries."""
    
    # System prompt for the agent
    SYSTEM_PROMPT = """You are the NVIDIA Doc Navigator.
You answer ONLY using public NVIDIA information.
When unsure, say "I cannot verify this from public data."
Always cite the specific docs or GitHub repo URLs.
Return step-by-step guidance, code examples, and version requirements.
Never hallucinate unreleased hardware, internal systems, or private APIs."""
    
    def __init__(self, vector_store: VectorStoreService, use_llm: bool = False):
        """
        Initialize the RAG agent.
        
        Args:
            vector_store: Vector store service for document retrieval
            use_llm: Whether to use an LLM for answer generation (requires API key)
        """
        self.vector_store = vector_store
        self.query_router = QueryRouter()
        self.use_llm = use_llm
        
        # For MVP, we'll use a mock LLM response
        # In production, this would use OpenAI/Anthropic API
    
    def query(self, user_query: str, n_results: int = 5, include_code_examples: bool = True) -> Dict:
        """
        Process a user query and return an answer.
        
        Args:
            user_query: The user's question
            n_results: Number of documents to retrieve
            include_code_examples: Whether to search for code examples
            
        Returns:
            Dict with answer, sources, and metadata
        """
        try:
            logger.info(f"Processing query: '{user_query[:100]}...'")
            
            # Check cache first
            cache_params = {"n_results": n_results, "include_code": include_code_examples}
            cached_result = cache_service.get(user_query, cache_params)
            if cached_result:
                logger.info("Returning cached result")
                return cached_result
            
            # Step 1: Route the query
            routing_result = self.query_router.route_query(user_query)
            query_type = routing_result['query_type']
            logger.info(f"Query routed to: {query_type.value} (confidence: {routing_result['confidence']:.2f})")
            
            # Step 2: Retrieve relevant documents
            retrieved_docs = self.vector_store.search(user_query, n_results=n_results)
            
            # Step 3: Get code examples if requested
            code_examples = []
            if include_code_examples and query_type != QueryType.GENERIC:
                code_examples = self._get_code_examples(user_query, query_type)
            
            # Step 4: Generate answer
            if self.use_llm:
                answer = self._generate_llm_answer(user_query, retrieved_docs, query_type, code_examples)
            else:
                answer = self._generate_mock_answer(user_query, retrieved_docs, query_type, code_examples)
            
            # Step 5: Format response
            result = {
                "query": user_query,
                "answer": answer,
                "query_type": query_type.value,
                "confidence": routing_result['confidence'],
                "sources": [
                    {
                        "title": doc['metadata'].get('title', 'N/A'),
                        "url": doc['metadata'].get('url', 'N/A'),
                        "relevance": 1.0 - (doc.get('distance', 0) if doc.get('distance') else 0)
                    }
                    for doc in retrieved_docs[:3]  # Top 3 sources
                ],
                "code_examples": code_examples,
                "matched_keywords": routing_result['matched_keywords'],
                "suggested_tags": routing_result['suggested_tags']
            }
            
            # Cache the result
            cache_service.set(user_query, result, cache_params)
            
            logger.info("Query processed successfully")
            return result
            
        except Exception as e:
            logger.error(f"Error processing query: {str(e)}")
            raise RuntimeError(f"Query processing failed: {str(e)}")
    
    def _get_code_examples(self, query: str, query_type: QueryType) -> List[Dict]:
        """Get relevant code examples from GitHub."""
        try:
            if query_type == QueryType.CUDA_GENERAL or query_type == QueryType.CUDA_PROFILING:
                return github_service.search_cuda_examples(query, max_results=2)
            elif query_type == QueryType.TENSORRT:
                return github_service.search_tensorrt_examples(query, max_results=2)
            elif query_type == QueryType.NEMO:
                return github_service.search_nemo_examples(query, max_results=2)
            else:
                return github_service.search_code(query, max_results=2)
        except Exception as e:
            logger.warning(f"Failed to fetch code examples: {str(e)}")
            return []
    
    def _generate_mock_answer(
        self, 
        query: str, 
        docs: List[Dict], 
        query_type: QueryType,
        code_examples: List[Dict] = None
    ) -> str:
        """
        Generate a mock answer for MVP (without LLM).
        In production, this would be replaced with actual LLM generation.
        """
        if not docs:
            return "I couldn't find relevant information in the NVIDIA documentation. Please try rephrasing your query or check the official NVIDIA documentation directly."
        
        # Create a simple answer based on retrieved documents
        answer_parts = []
        
        # Add context-specific intro based on query type
        if query_type == QueryType.MIG_CONFIG:
            answer_parts.append("Based on NVIDIA's MIG documentation:")
        elif query_type == QueryType.TENSORRT:
            answer_parts.append("According to TensorRT documentation:")
        elif query_type == QueryType.CUDA_GENERAL:
            answer_parts.append("From the CUDA programming guide:")
        else:
            answer_parts.append("Based on NVIDIA documentation:")
        
        # Add relevant excerpts
        answer_parts.append("\n\n**Key Information:**\n")
        
        for i, doc in enumerate(docs[:2], 1):
            content_preview = doc['content'][:300] + "..." if len(doc['content']) > 300 else doc['content']
            answer_parts.append(f"{i}. {content_preview}\n")
        
        # Add code examples if available
        if code_examples and len(code_examples) > 0:
            answer_parts.append("\n**Code Examples:**\n")
            for i, example in enumerate(code_examples, 1):
                answer_parts.append(f"{i}. [{example['name']}]({example['url']}) - {example['repo']}\n")
        
        # Add sources section
        answer_parts.append("\n**Sources:**\n")
        for i, doc in enumerate(docs[:3], 1):
            title = doc['metadata'].get('title', 'NVIDIA Documentation')
            url = doc['metadata'].get('url', '#')
            answer_parts.append(f"{i}. [{title}]({url})\n")
        
        return "".join(answer_parts)
    
    def _generate_llm_answer(
        self, 
        query: str, 
        docs: List[Dict], 
        query_type: QueryType
    ) -> str:
        """
        Generate answer using LLM (OpenAI/Anthropic).
        This is a placeholder for production implementation.
        """
        # TODO: Implement actual LLM integration
        # This would use OpenAI API or Anthropic API
        
        # Build context from retrieved documents
        context = "\n\n".join([
            f"Document {i+1} ({doc['metadata'].get('title', 'N/A')}):\n{doc['content'][:500]}"
            for i, doc in enumerate(docs[:5])
        ])
        
        # In production, this would be:
        # response = openai.ChatCompletion.create(
        #     model="gpt-4",
        #     messages=[
        #         {"role": "system", "content": self.SYSTEM_PROMPT},
        #         {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query}"}
        #     ]
        # )
        # return response.choices[0].message.content
        
        return self._generate_mock_answer(query, docs, query_type)
    
    def get_troubleshooting_steps(self, query: str, query_type: QueryType) -> List[str]:
        """
        Generate troubleshooting steps for common issues.
        """
        troubleshooting_templates = {
            QueryType.MIG_CONFIG: [
                "1. Enable MIG mode: `sudo nvidia-smi -i 0 -mig 1`",
                "2. Create MIG instances: `sudo nvidia-smi mig -cgi 19,19 -C`",
                "3. Verify instances: `nvidia-smi -L`",
                "4. Check device plugin configuration",
                "5. Restart kubelet if using Kubernetes"
            ],
            QueryType.NVLINK: [
                "1. Check NVLink status: `nvidia-smi nvlink --status`",
                "2. Verify GPU topology: `nvidia-smi topo -m`",
                "3. Check driver version compatibility",
                "4. Verify hardware connections",
                "5. Review system BIOS settings"
            ],
            QueryType.CUDA_PROFILING: [
                "1. Use Nsight Systems for timeline profiling",
                "2. Use Nsight Compute for kernel analysis",
                "3. Check for memory bottlenecks",
                "4. Analyze kernel occupancy",
                "5. Review memory access patterns"
            ]
        }
        
        return troubleshooting_templates.get(query_type, [
            "1. Review the official NVIDIA documentation",
            "2. Check version compatibility",
            "3. Verify system configuration",
            "4. Consult NVIDIA Developer Forums"
        ])


if __name__ == "__main__":
    # Test the RAG agent
    from app.services.vector_store import VectorStoreService
    
    # Initialize services
    vector_store = VectorStoreService()
    agent = RAGAgent(vector_store, use_llm=False)
    
    # Test query
    test_query = "How do I configure MIG on A100?"
    
    print("RAG Agent Test\n" + "="*80)
    print(f"Query: {test_query}\n")
    
    result = agent.query(test_query)
    
    print(f"Query Type: {result['query_type']}")
    print(f"Confidence: {result['confidence']:.2f}")
    print(f"\nAnswer:\n{result['answer']}")
    print(f"\nSources:")
    for source in result['sources']:
        print(f"  - {source['title']}: {source['url']}")

"""
RAG Agent Service
Main agent that orchestrates RAG retrieval and answer generation.
"""

from typing import List, Dict, Optional
from app.services.vector_store import VectorStoreService
from app.services.query_router import QueryRouter, QueryType
from app.services.cache import cache_service
from app.services.github_search import github_service
from app.services.compatibility import compatibility_service
from app.services.debugger import debugger_service
from app.core.logger import setup_logger
from app.core.config import settings

# Import LangChain components
try:
    from langchain_openai import ChatOpenAI
    from langchain_huggingface import HuggingFaceEndpoint
    from langchain_core.prompts import PromptTemplate
    from langchain_core.output_parsers import StrOutputParser
    HAS_LANGCHAIN = True
except ImportError:
    HAS_LANGCHAIN = False

logger = setup_logger(__name__, "rag_agent.log")


class RAGAgent:
    """Main RAG agent for answering NVIDIA documentation queries."""
    
    # System prompt for the agent
    SYSTEM_PROMPT = """You are the NVIDIA Doc Navigator, an expert AI assistant for NVIDIA developers.
You answer ONLY using the provided context from public NVIDIA documentation.
When unsure, say "I cannot verify this from public data."
Always cite the specific docs or GitHub repo URLs provided in the context.
Return step-by-step guidance, code examples, and version requirements.
Never hallucinate unreleased hardware, internal systems, or private APIs.

Context:
{context}

Question:
{question}

Answer:"""
    
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
        self.llm = None
        
        if self.use_llm and HAS_LANGCHAIN:
            # Try Hugging Face first (User Preference)
            if settings.HUGGINGFACE_API_KEY:
                try:
                    self.llm = HuggingFaceEndpoint(
                        repo_id=settings.HUGGINGFACE_REPO_ID,
                        huggingfacehub_api_token=settings.HUGGINGFACE_API_KEY,
                        temperature=0.2,
                        max_new_tokens=512
                    )
                    logger.info(f"Hugging Face LLM initialized ({settings.HUGGINGFACE_REPO_ID})")
                except Exception as e:
                    logger.error(f"Failed to initialize Hugging Face LLM: {str(e)}")
                    self.use_llm = False
            
            # Fallback to OpenAI if configured and HF failed or not set
            elif settings.OPENAI_API_KEY:
                try:
                    self.llm = ChatOpenAI(
                        api_key=settings.OPENAI_API_KEY,
                        model="gpt-4-turbo-preview",
                        temperature=0.2
                    )
                    logger.info("OpenAI LLM initialized")
                except Exception as e:
                    logger.error(f"Failed to initialize OpenAI LLM: {str(e)}")
                    self.use_llm = False
            
            else:
                logger.warning("No API keys found. Falling back to mock responses.")
                self.use_llm = False
    
    def query(self, user_query: str, n_results: int = 5, include_code_examples: bool = True) -> Dict:
        """
        Process a user query and return an answer.
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
            
            # Step 4: Check for compatibility issues (F4)
            compatibility_info = compatibility_service.check_compatibility(user_query)
            
            # Step 5: Check for debug flows (F5)
            debug_flow = debugger_service.get_debug_flow(user_query)
            
            # Step 6: Generate answer
            if self.use_llm and self.llm:
                answer = self._generate_llm_answer(user_query, retrieved_docs, query_type, compatibility_info, debug_flow)
            else:
                answer = self._generate_mock_answer(user_query, retrieved_docs, query_type, code_examples, compatibility_info, debug_flow)
            
            # Step 7: Format response
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
        code_examples: List[Dict] = None,
        compatibility_info: Dict = None,
        debug_flow: Dict = None
    ) -> str:
        """
        Generate a mock answer for MVP (without LLM).
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
        
        # Add Compatibility Info
        if compatibility_info:
            answer_parts.append("\n**Version Compatibility:**\n")
            if compatibility_info['warnings']:
                for warn in compatibility_info['warnings']:
                    answer_parts.append(f"⚠️ {warn}\n")
            if compatibility_info['info']:
                for info in compatibility_info['info']:
                    answer_parts.append(f"ℹ️ {info}\n")
        
        # Add Debug Flow
        if debug_flow:
            answer_parts.append(f"\n**{debug_flow['title']}:**\n")
            for step in debug_flow['steps']:
                answer_parts.append(f"{step['id']}. **{step['action']}**\n")
                answer_parts.append(f"   Command: `{step['command']}`\n")
                answer_parts.append(f"   Fix: {step['fix']}\n")
        
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
        query_type: QueryType,
        compatibility_info: Dict = None,
        debug_flow: Dict = None
    ) -> str:
        """
        Generate answer using LLM (Hugging Face or OpenAI).
        """
        try:
            # Build context from retrieved documents
            context_parts = []
            for i, doc in enumerate(docs[:5]):
                title = doc['metadata'].get('title', 'N/A')
                url = doc['metadata'].get('url', 'N/A')
                content = doc['content']
                context_parts.append(f"Source {i+1} [{title}]({url}):\n{content}\n")
            
            # Add compatibility info to context
            if compatibility_info:
                context_parts.append("\nCOMPATIBILITY ALERTS:")
                for warn in compatibility_info.get('warnings', []):
                    context_parts.append(f"- WARNING: {warn}")
            
            # Add debug flow to context
            if debug_flow:
                context_parts.append(f"\nDEBUGGING GUIDE ({debug_flow['title']}):")
                for step in debug_flow['steps']:
                    context_parts.append(f"Step {step['id']}: {step['action']} -> Run `{step['command']}`")
            
            context = "\n".join(context_parts)
            
            # Create prompt
            prompt = PromptTemplate.from_template(self.SYSTEM_PROMPT)
            
            # Create chain
            chain = prompt | self.llm | StrOutputParser()
            
            # Execute chain
            response = chain.invoke({
                "context": context,
                "question": query
            })
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating LLM answer: {str(e)}")
            # Fallback to mock answer
            return self._generate_mock_answer(query, docs, query_type, None, compatibility_info, debug_flow)


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

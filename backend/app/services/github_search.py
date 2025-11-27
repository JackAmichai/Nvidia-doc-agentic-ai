"""
GitHub Code Search Service
Fetches code examples from NVIDIA's official GitHub repositories.
"""

import requests
from typing import List, Dict, Optional
import time
from app.core.logger import setup_logger
from app.core.config import settings

logger = setup_logger(__name__, "github_search.log")


class GitHubCodeSearchService:
    """Service for searching code examples in NVIDIA GitHub repositories."""
    
    # Official NVIDIA GitHub repositories
    NVIDIA_REPOS = [
        "NVIDIA/cuda-samples",
        "NVIDIA/TensorRT",
        "NVIDIA/NeMo",
        "triton-inference-server/server",
        "NVIDIA/cutlass",
        "NVIDIA/cuDNN",
        "NVIDIA/DeepLearningExamples"
    ]
    
    def __init__(self, github_token: Optional[str] = None):
        """
        Initialize GitHub search service.
        
        Args:
            github_token: Optional GitHub API token for higher rate limits
        """
        self.base_url = "https://api.github.com"
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "NVIDIA-Doc-Navigator"
        }
        
        if github_token:
            self.headers["Authorization"] = f"token {github_token}"
            logger.info("GitHub token provided - using authenticated requests")
        else:
            logger.info("No GitHub token - using unauthenticated requests (lower rate limits)")
    
    def search_code(
        self, 
        query: str, 
        repo: Optional[str] = None,
        language: Optional[str] = None,
        max_results: int = 5
    ) -> List[Dict]:
        """
        Search for code examples.
        
        Args:
            query: Search query (keywords)
            repo: Specific repository to search (e.g., "NVIDIA/cuda-samples")
            language: Programming language filter (e.g., "cuda", "python")
            max_results: Maximum number of results to return
            
        Returns:
            List of code examples with metadata
        """
        try:
            # Build search query
            search_query = query
            
            if repo:
                search_query += f" repo:{repo}"
            elif any(nvidia_term in query.lower() for nvidia_term in ["cuda", "tensorrt", "nemo", "triton"]):
                # Search in relevant NVIDIA repos if no specific repo provided
                repos_filter = " ".join([f"repo:{r}" for r in self.NVIDIA_REPOS[:3]])
                search_query += f" {repos_filter}"
            
            if language:
                search_query += f" language:{language}"
            
            logger.info(f"Searching GitHub: '{search_query}'")
            
            # Make API request
            url = f"{self.base_url}/search/code"
            params = {
                "q": search_query,
                "per_page": min(max_results, 10)  # GitHub API limits
            }
            
            response = requests.get(
                url, 
                headers=self.headers, 
                params=params,
                timeout=10
            )
            
            if response.status_code == 403:
                logger.warning("GitHub API rate limit exceeded")
                return []
            
            response.raise_for_status()
            data = response.json()
            
            # Format results
            examples = []
            for item in data.get("items", [])[:max_results]:
                examples.append({
                    "name": item["name"],
                    "path": item["path"],
                    "repo": item["repository"]["full_name"],
                    "url": item["html_url"],
                    "description": f"Code example from {item['repository']['full_name']}"
                })
            
            logger.info(f"Found {len(examples)} code examples")
            return examples
            
        except requests.exceptions.RequestException as e:
            logger.error(f"GitHub API request failed: {str(e)}")
            return []
        except Exception as e:
            logger.error(f"Error searching GitHub: {str(e)}")
            return []
    
    def get_file_content(self, repo: str, path: str, ref: str = "main") -> Optional[str]:
        """
        Get the content of a specific file from a repository.
        
        Args:
            repo: Repository (e.g., "NVIDIA/cuda-samples")
            path: File path in the repository
            ref: Branch or commit ref (default: "main")
            
        Returns:
            File content as string or None if failed
        """
        try:
            url = f"{self.base_url}/repos/{repo}/contents/{path}"
            params = {"ref": ref}
            
            response = requests.get(
                url,
                headers=self.headers,
                params=params,
                timeout=10
            )
            
            if response.status_code == 404:
                logger.warning(f"File not found: {repo}/{path}")
                return None
            
            response.raise_for_status()
            data = response.json()
            
            # Decode content (it's base64 encoded)
            import base64
            content = base64.b64decode(data["content"]).decode("utf-8")
            
            logger.info(f"Retrieved file content: {repo}/{path}")
            return content
            
        except Exception as e:
            logger.error(f"Error getting file content: {str(e)}")
            return None
    
    def search_cuda_examples(self, query: str, max_results: int = 3) -> List[Dict]:
        """Search specifically for CUDA code examples."""
        return self.search_code(
            query=query,
            repo="NVIDIA/cuda-samples",
            language="cuda",
            max_results=max_results
        )
    
    def search_tensorrt_examples(self, query: str, max_results: int = 3) -> List[Dict]:
        """Search specifically for TensorRT examples."""
        return self.search_code(
            query=query,
            repo="NVIDIA/TensorRT",
            language="python",
            max_results=max_results
        )
    
    def search_nemo_examples(self, query: str, max_results: int = 3) -> List[Dict]:
        """Search specifically for NeMo examples."""
        return self.search_code(
            query=query,
            repo="NVIDIA/NeMo",
            language="python",
            max_results=max_results
        )


# Global instance
github_service = GitHubCodeSearchService()

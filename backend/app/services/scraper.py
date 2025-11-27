"""
NVIDIA Documentation Scraper
Scrapes public NVIDIA documentation and prepares it for RAG ingestion.
"""

import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
import time
from urllib.parse import urljoin, urlparse
from app.core.logger import setup_logger
from app.core.config import settings

logger = setup_logger(__name__, "scraper.log")


class NVIDIADocScraper:
    """Scraper for NVIDIA documentation sources."""
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        
        # Public NVIDIA documentation sources
        self.sources = {
            "cuda_docs": "https://docs.nvidia.com/cuda/",
            "tensorrt_docs": "https://docs.nvidia.com/deeplearning/tensorrt/",
            "nvml_docs": "https://docs.nvidia.com/deploy/nvml-api/",
            "mig_guide": "https://docs.nvidia.com/datacenter/tesla/mig-user-guide/",
        }
    
    def fetch_page(self, url: str, retries: int = 3) -> Optional[str]:
        """
        Fetch a single page with retry logic.
        
        Args:
            url: URL to fetch
            retries: Number of retry attempts
            
        Returns:
            HTML content or None if failed
        """
        for attempt in range(retries):
            try:
                logger.info(f"Fetching {url} (attempt {attempt + 1}/{retries})")
                
                response = requests.get(
                    url, 
                    headers=self.headers, 
                    timeout=settings.SCRAPER_TIMEOUT
                )
                response.raise_for_status()
                
                logger.info(f"Successfully fetched {url}")
                return response.text
                
            except requests.exceptions.Timeout:
                logger.warning(f"Timeout fetching {url} (attempt {attempt + 1})")
                if attempt < retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                    
            except requests.exceptions.RequestException as e:
                logger.error(f"Error fetching {url}: {str(e)}")
                if attempt < retries - 1:
                    time.sleep(2 ** attempt)
                else:
                    return None
                    
            except Exception as e:
                logger.error(f"Unexpected error fetching {url}: {str(e)}")
                return None
        
        return None
    
    def extract_text_from_html(self, html: str, url: str) -> Dict[str, str]:
        """Extract meaningful text from HTML."""
        soup = BeautifulSoup(html, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer"]):
            script.decompose()
        
        # Get title
        title = soup.find('title')
        title_text = title.get_text().strip() if title else "Untitled"
        
        # Get main content
        # Try common content containers
        main_content = (
            soup.find('main') or 
            soup.find('article') or 
            soup.find('div', class_='content') or
            soup.find('body')
        )
        
        if main_content:
            text = main_content.get_text(separator='\n', strip=True)
        else:
            text = soup.get_text(separator='\n', strip=True)
        
        # Clean up excessive whitespace
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        clean_text = '\n'.join(lines)
        
        return {
            "url": url,
            "title": title_text,
            "content": clean_text
        }
    
    def scrape_documentation(self, source_name: str, max_pages: int = 5) -> List[Dict[str, str]]:
        """
        Scrape documentation from a source.
        For MVP, we'll just scrape a few pages as examples.
        """
        if source_name not in self.sources:
            logger.warning(f"Unknown source: {source_name}")
            return []
        
        base_url = self.sources[source_name]
        documents = []
        
        logger.info(f"Scraping {source_name} from {base_url}")
        
        # Fetch the main page
        html = self.fetch_page(base_url)
        if html:
            doc = self.extract_text_from_html(html, base_url)
            doc['source'] = source_name  # Add source metadata
            documents.append(doc)
            logger.info(f"Scraped: {doc['title']}")
        else:
            logger.error(f"Failed to scrape {source_name}")
        
        time.sleep(settings.SCRAPER_RATE_LIMIT)  # Rate limiting
        
        return documents
    
    def scrape_all_sources(self, max_pages_per_source: int = 3) -> List[Dict[str, str]]:
        """Scrape all configured sources."""
        all_documents = []
        
        for source_name in self.sources.keys():
            docs = self.scrape_documentation(source_name, max_pages_per_source)
            all_documents.extend(docs)
            time.sleep(2)  # Rate limiting between sources
        
        print(f"\nTotal documents scraped: {len(all_documents)}")
        return all_documents


if __name__ == "__main__":
    # Test the scraper
    scraper = NVIDIADocScraper()
    docs = scraper.scrape_all_sources(max_pages_per_source=1)
    
    for doc in docs:
        print(f"\n{'='*80}")
        print(f"Title: {doc['title']}")
        print(f"URL: {doc['url']}")
        print(f"Content length: {len(doc['content'])} chars")
        print(f"Preview: {doc['content'][:200]}...")

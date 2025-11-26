"""
NVIDIA Documentation Scraper
Scrapes public NVIDIA documentation and prepares it for RAG ingestion.
"""

import requests
from bs4 import BeautifulSoup
from typing import List, Dict
import time
from urllib.parse import urljoin, urlparse


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
    
    def fetch_page(self, url: str) -> str:
        """Fetch a single page."""
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            return response.text
        except Exception as e:
            print(f"Error fetching {url}: {e}")
            return ""
    
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
            print(f"Unknown source: {source_name}")
            return []
        
        base_url = self.sources[source_name]
        documents = []
        
        print(f"Scraping {source_name} from {base_url}")
        
        # Fetch the main page
        html = self.fetch_page(base_url)
        if html:
            doc = self.extract_text_from_html(html, base_url)
            documents.append(doc)
            print(f"Scraped: {doc['title']}")
        
        time.sleep(1)  # Be respectful with rate limiting
        
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

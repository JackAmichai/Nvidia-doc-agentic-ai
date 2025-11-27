"""
Cache Service
Simple in-memory cache for query results.
"""

from typing import Dict, Optional, Any
import time
import hashlib
from app.core.logger import setup_logger
from app.core.config import settings

logger = setup_logger(__name__, "cache.log")


class CacheService:
    """In-memory cache for query results."""
    
    def __init__(self, ttl: int = None):
        """
        Initialize cache service.
        
        Args:
            ttl: Time-to-live for cache entries in seconds
        """
        self.ttl = ttl or settings.CACHE_TTL
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.enabled = settings.ENABLE_CACHE
        logger.info(f"Cache initialized (enabled={self.enabled}, ttl={self.ttl}s)")
    
    def _get_cache_key(self, query: str, params: Dict = None) -> str:
        """Generate a cache key from query and parameters."""
        key_str = f"{query}:{str(params) if params else ''}"
        return hashlib.md5(key_str.encode()).hexdigest()
    
    def get(self, query: str, params: Dict = None) -> Optional[Dict]:
        """
        Retrieve a cached result.
        
        Args:
            query: The query string
            params: Additional parameters that affect the result
            
        Returns:
            Cached result or None if not found/expired
        """
        if not self.enabled:
            return None
        
        cache_key = self._get_cache_key(query, params)
        
        if cache_key not in self.cache:
            logger.debug(f"Cache miss for query: '{query[:50]}...'")
            return None
        
        entry = self.cache[cache_key]
        
        # Check if expired
        if time.time() - entry['timestamp'] > self.ttl:
            logger.debug(f"Cache expired for query: '{query[:50]}...'")
            del self.cache[cache_key]
            return None
        
        logger.info(f"Cache hit for query: '{query[:50]}...'")
        return entry['data']
    
    def set(self, query: str, data: Dict, params: Dict = None) -> None:
        """
        Store a result in cache.
        
        Args:
            query: The query string
            data: The data to cache
            params: Additional parameters that affect the result
        """
        if not self.enabled:
            return
        
        cache_key = self._get_cache_key(query, params)
        self.cache[cache_key] = {
            'data': data,
            'timestamp': time.time()
        }
        logger.debug(f"Cached result for query: '{query[:50]}...'")
    
    def clear(self) -> None:
        """Clear all cache entries."""
        count = len(self.cache)
        self.cache.clear()
        logger.info(f"Cache cleared ({count} entries removed)")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        total_entries = len(self.cache)
        expired = 0
        
        current_time = time.time()
        for entry in self.cache.values():
            if current_time - entry['timestamp'] > self.ttl:
                expired += 1
        
        return {
            'enabled': self.enabled,
            'total_entries': total_entries,
            'active_entries': total_entries - expired,
            'expired_entries': expired,
            'ttl_seconds': self.ttl
        }


# Global cache instance
cache_service = CacheService()

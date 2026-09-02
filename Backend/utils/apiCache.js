// Backend/utils/apiCache.js
/**
 * Ultra-fast In-Memory API Cache & DB Optimizer
 * Speeds up repeat API calls to < 1ms
 */

class ApiCache {
  constructor() {
    this.cache = new Map();
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set(key, value, ttlSeconds = 60) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  clear(pattern = null) {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export const cacheInstance = new ApiCache();

export const cacheMiddleware = (durationInSeconds = 60) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl || req.url;
    const cachedResponse = cacheInstance.get(key);

    if (cachedResponse) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      return res.status(cachedResponse.status || 200).json(cachedResponse.data);
    }

    // Intercept res.json to cache response before sending
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheInstance.set(key, { status: res.statusCode, data }, durationInSeconds);
      }
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      return originalJson(data);
    };

    next();
  };
};

export const invalidateCache = (pattern) => {
  cacheInstance.clear(pattern);
};

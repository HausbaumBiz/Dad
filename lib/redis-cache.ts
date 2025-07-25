interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class RedisCache {
  private memoryCache = new Map<string, CacheEntry<any>>()
  private maxMemoryEntries = 1000
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Start cleanup interval for memory cache
    this.cleanupInterval = setInterval(() => {
      this.cleanupMemoryCache()
    }, 30000) // Clean up every 30 seconds
  }

  private cleanupMemoryCache() {
    const now = Date.now()
    const entries = Array.from(this.memoryCache.entries())

    // Remove expired entries
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key)
      }
    }

    // If still too many entries, remove oldest ones
    if (this.memoryCache.size > this.maxMemoryEntries) {
      const sortedEntries = entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      const toRemove = sortedEntries.slice(0, this.memoryCache.size - this.maxMemoryEntries)

      for (const [key] of toRemove) {
        this.memoryCache.delete(key)
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key)
    if (memoryEntry) {
      const now = Date.now()
      if (now - memoryEntry.timestamp <= memoryEntry.ttl) {
        return memoryEntry.data as T
      } else {
        this.memoryCache.delete(key)
      }
    }

    return null
  }

  async set<T>(key: string, data: T, ttlMs = 300000): Promise<void> {
    // Store in memory cache
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    })
  }

  async invalidate(key: string): Promise<void> {
    this.memoryCache.delete(key)
  }

  async clear(): Promise<void> {
    this.memoryCache.clear()
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.memoryCache.clear()
  }
}

let cache: RedisCache | null = null

export function getRedisCache(): RedisCache {
  if (!cache) {
    cache = new RedisCache()
  }
  return cache
}

// Cleanup on process exit
if (typeof process !== "undefined") {
  process.on("exit", () => {
    if (cache) {
      cache.destroy()
    }
  })
}

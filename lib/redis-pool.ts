import { Redis } from "@upstash/redis"

interface RedisConnection {
  redis: Redis
  lastUsed: number
  inUse: boolean
}

class RedisConnectionPool {
  private connections: RedisConnection[] = []
  private maxConnections = 10
  private connectionTimeout = 30000 // 30 seconds
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000) // Clean up every minute
  }

  private createConnection(): RedisConnection {
    const redis = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
      retry: {
        retries: 2,
        backoff: (retryCount) => Math.min(500 * Math.pow(2, retryCount), 2000),
      },
    })

    return {
      redis,
      lastUsed: Date.now(),
      inUse: false,
    }
  }

  private cleanup() {
    const now = Date.now()
    this.connections = this.connections.filter((conn) => {
      if (!conn.inUse && now - conn.lastUsed > this.connectionTimeout) {
        // Connection is old and not in use, remove it
        return false
      }
      return true
    })
  }

  private getAvailableConnection(): RedisConnection | null {
    return this.connections.find((conn) => !conn.inUse) || null
  }

  async withConnection<T>(operation: (redis: Redis) => Promise<T>): Promise<T> {
    let connection = this.getAvailableConnection()

    if (!connection && this.connections.length < this.maxConnections) {
      connection = this.createConnection()
      this.connections.push(connection)
    }

    if (!connection) {
      // Wait for a connection to become available
      await new Promise((resolve) => setTimeout(resolve, 100))
      connection = this.getAvailableConnection()
    }

    if (!connection) {
      // Still no connection available, create a temporary one
      connection = this.createConnection()
    }

    connection.inUse = true
    connection.lastUsed = Date.now()

    try {
      const result = await operation(connection.redis)
      return result
    } finally {
      connection.inUse = false
      connection.lastUsed = Date.now()
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.connections = []
  }
}

let pool: RedisConnectionPool | null = null

export function getRedisPool(): RedisConnectionPool {
  if (!pool) {
    pool = new RedisConnectionPool()
  }
  return pool
}

// Cleanup on process exit
if (typeof process !== "undefined") {
  process.on("exit", () => {
    if (pool) {
      pool.destroy()
    }
  })
}

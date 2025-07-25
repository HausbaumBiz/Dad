import { Redis } from "@upstash/redis"
import { getRedisPool } from "./redis-pool"

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.REDIS_URL || "",
  token: process.env.KV_REST_API_TOKEN || "",
})

// Legacy redis instance for backward compatibility
export const legacyRedis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
  retry: {
    retries: 3,
    backoff: (retryCount) => Math.min(1000 * Math.pow(2, retryCount), 5000),
  },
})

// Enhanced redis operations using connection pool
export const pooledRedis = {
  async get(key: string) {
    const pool = getRedisPool()
    return pool.withConnection(async (redis) => redis.get(key))
  },

  async set(key: string, value: any, options?: { ex?: number }) {
    const pool = getRedisPool()
    return pool.withConnection(async (redis) => {
      if (options?.ex) {
        return redis.setex(key, options.ex, value)
      }
      return redis.set(key, value)
    })
  },

  async del(...keys: string[]) {
    const pool = getRedisPool()
    return pool.withConnection(async (redis) => redis.del(...keys))
  },

  async sadd(key: string, ...members: string[]) {
    const pool = getRedisPool()
    return pool.withConnection(async (redis) => redis.sadd(key, ...members))
  },

  async smembers(key: string) {
    const pool = getRedisPool()
    return pool.withConnection(async (redis) => redis.smembers(key))
  },

  async hset(key: string, field: string | Record<string, any>, value?: any) {
    const pool = getRedisPool()
    return pool.withConnection(async (redis) => redis.hset(key, field, value))
  },

  async hget(key: string, field: string) {
    const pool = getRedisPool()
    return pool.withConnection(async (redis) => redis.hget(key, field))
  },

  async ping() {
    const pool = getRedisPool()
    return pool.withConnection(async (redis) => redis.ping())
  },

  async keys(pattern: string) {
    const pool = getRedisPool()
    return pool.withConnection(async (redis) => redis.keys(pattern))
  },

  async type(key: string) {
    const pool = getRedisPool()
    return pool.withConnection(async (redis) => redis.type(key))
  },
}

// Export as both 'redis' and 'kv' to maintain compatibility
export default redis
export { redis }
export { redis as kv }
export { Redis }

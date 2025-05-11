import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.REDIS_URL || "",
  token: process.env.KV_REST_API_TOKEN || "",
})

// Export as both 'redis' and 'kv' to maintain compatibility
export default redis
export { redis }
export { redis as kv }
export { Redis }

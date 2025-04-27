import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.KV_REST_API_URL || "",
  token: process.env.KV_REST_API_TOKEN || "",
})

// Export as both 'redis' and 'kv' to maintain compatibility
export { redis }
export { redis as kv }
export default redis

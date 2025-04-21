import { Redis } from "@upstash/redis"

// Create a Redis client using the environment variables provided by Vercel
const redis = new Redis({
  url: process.env.KV_REST_API_URL || "",
  token: process.env.KV_REST_API_TOKEN || "",
})

// Export the redis client as the default export
export default redis

// Also export as a named export 'kv' to satisfy the import requirements
export const kv = redis

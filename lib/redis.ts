import { Redis } from "@upstash/redis"

// Create a Redis client using the environment variables provided by Vercel
const redis = new Redis({
  url: process.env.KV_REST_API_URL || "",
  token: process.env.KV_REST_API_TOKEN || "",
})

export default redis

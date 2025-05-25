"use server"

import { redis } from "@/lib/redis"

export async function searchRedisKeys(pattern: string): Promise<{
  success: boolean
  keys?: string[]
  error?: string
}> {
  try {
    // Validate pattern to prevent security issues
    if (!pattern || pattern.trim() === "") {
      pattern = "*"
    }

    // Use SCAN instead of KEYS for production safety
    let cursor = 0
    const allKeys: string[] = []

    do {
      // @ts-ignore - The Upstash Redis client types might not include scan
      const [nextCursor, keys] = await redis.scan(cursor, { match: pattern, count: 100 })
      cursor = Number.parseInt(nextCursor)
      allKeys.push(...keys)
    } while (cursor !== 0)

    return {
      success: true,
      keys: allKeys.sort(),
    }
  } catch (error) {
    console.error("Error searching Redis keys:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function getRedisValue(key: string): Promise<{
  success: boolean
  value?: any
  error?: string
}> {
  try {
    if (!key) {
      return { success: false, error: "No key provided" }
    }

    // First, determine the type of the key
    const type = await redis.type(key)

    let value: any

    switch (type) {
      case "string":
        value = await redis.get(key)

        // Try to parse JSON if it looks like JSON
        if (
          (typeof value === "string" && value.startsWith("{") && value.endsWith("}")) ||
          (value.startsWith("[") && value.endsWith("]"))
        ) {
          try {
            value = JSON.parse(value)
          } catch (e) {
            // If parsing fails, keep the original string
          }
        }
        break

      case "hash":
        value = await redis.hgetall(key)

        // Try to parse JSON values in hash
        if (value) {
          for (const [k, v] of Object.entries(value)) {
            if (
              typeof v === "string" &&
              ((v.startsWith("{") && v.endsWith("}")) || (v.startsWith("[") && v.endsWith("]")))
            ) {
              try {
                value[k] = JSON.parse(v as string)
              } catch (e) {
                // Keep original if parsing fails
              }
            }
          }
        }
        break

      case "list":
        value = await redis.lrange(key, 0, -1)
        break

      case "set":
        value = await redis.smembers(key)
        break

      case "zset":
        value = await redis.zrange(key, 0, -1, "WITHSCORES")
        break

      case "none":
        return { success: false, error: "Key does not exist" }

      default:
        return { success: false, error: `Unsupported Redis type: ${type}` }
    }

    return { success: true, value }
  } catch (error) {
    console.error("Error getting Redis value:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

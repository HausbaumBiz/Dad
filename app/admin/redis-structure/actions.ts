"use server"

import { kv } from "@vercel/kv"

interface RedisData {
  key: string
  type: string
  value: any
  size?: number
}

interface BusinessRedisStructure {
  businessId: string
  businessName?: string
  coreData: RedisData[]
  categories: RedisData[]
  media: RedisData[]
  zipCodes: RedisData[]
  other: RedisData[]
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  if (error && typeof error === "object") {
    // Handle cases where error is an object but not an Error instance
    if ("message" in error) {
      return String(error.message)
    }
    if ("toString" in error && typeof error.toString === "function") {
      return error.toString()
    }
  }
  return String(error)
}

export async function getAllBusinessIds(): Promise<string[]> {
  try {
    // Try to get from the businesses set first
    const businessIds = await kv.smembers("businesses")
    if (businessIds && businessIds.length > 0) {
      return businessIds.map((id) => String(id))
    }

    // Fallback: check for specific business keys
    const specificKeys = [
      "business:213141c4-9616-416e-84ad-a58b81fe3f8c",
      "business:1744c078-461b-45bc-903e-e0999ac2aa87",
    ]

    const existingIds: string[] = []
    for (const key of specificKeys) {
      try {
        const exists = await kv.exists(key)
        if (exists) {
          existingIds.push(key.replace("business:", ""))
        }
      } catch (err) {
        console.error(`Error checking key ${key}:`, getErrorMessage(err))
      }
    }

    return existingIds
  } catch (error) {
    console.error("Error getting business IDs:", getErrorMessage(error))
    return []
  }
}

export async function getBusinessRedisStructure(businessId: string): Promise<BusinessRedisStructure> {
  try {
    const structure: BusinessRedisStructure = {
      businessId,
      coreData: [],
      categories: [],
      media: [],
      zipCodes: [],
      other: [],
    }

    // Define specific keys to check instead of using patterns
    const keysToCheck = [
      // Core business data
      `business:${businessId}`,
      `business:email:${businessId}`,

      // Business-specific keys
      `business:${businessId}:categories`,
      `business:${businessId}:media`,
      `business:${businessId}:zipcode`,
      `business:${businessId}:zipcodes`,
      `business:${businessId}:nationwide`,

      // Common category keys that might contain this business
      "category:automotive",
      "category:automotive-services",
      "category:elder-care",
      "category:financial-services",
      "category:homecare",
      "category:insurance,-finance,-debt-and-sales",
      "category:finance-insurance",
      "category:home-improvement",
      "category:care-services",
      "category:beauty-wellness",
      "category:food-dining",
      "category:tech-it-services",

      // ZIP code keys
      "businesses:nationwide",
    ]

    // Process each key
    for (const key of keysToCheck) {
      try {
        // First check if the key exists
        const exists = await kv.exists(key)
        if (!exists) {
          continue
        }

        let type: string
        try {
          type = await kv.type(key)
        } catch (typeError) {
          console.error(`Error getting type for key ${key}:`, getErrorMessage(typeError))
          // If we can't get the type, mark it as corrupted
          structure.other.push({
            key,
            type: "corrupted",
            value: `Corrupted key - cannot determine type: ${getErrorMessage(typeError)}`,
          })
          continue
        }

        // Skip keys that don't exist
        if (type === "none") {
          continue
        }

        let value: any
        let size: number | undefined

        try {
          switch (type) {
            case "string":
              try {
                value = await kv.get(key)
              } catch (getError) {
                value = `Error reading string: ${getErrorMessage(getError)}`
              }
              break

            case "hash":
              try {
                value = await kv.hgetall(key)
                size = value && typeof value === "object" ? Object.keys(value).length : 0
              } catch (hashError) {
                value = `Error reading hash: ${getErrorMessage(hashError)}`
                size = 0
              }
              break

            case "set":
              try {
                const setMembers = await kv.smembers(key)
                // Ensure we have an array
                if (Array.isArray(setMembers)) {
                  value = setMembers
                } else if (setMembers !== null && setMembers !== undefined) {
                  value = [setMembers]
                } else {
                  value = []
                }
                size = value.length

                // Check if this business is in this set
                if (!key.startsWith(`business:${businessId}`) && Array.isArray(value)) {
                  if (!value.includes(businessId) && !value.includes(String(businessId))) {
                    continue // Skip this key if business is not in the set
                  }
                }
              } catch (setError) {
                console.error(`Error processing set ${key}:`, getErrorMessage(setError))
                value = `Corrupted set data: ${getErrorMessage(setError)}`
                size = 0
              }
              break

            case "list":
              try {
                const listItems = await kv.lrange(key, 0, -1)
                value = Array.isArray(listItems) ? listItems : [listItems].filter(Boolean)
                size = value.length
              } catch (listError) {
                console.error(`Error processing list ${key}:`, getErrorMessage(listError))
                value = `Error reading list: ${getErrorMessage(listError)}`
                size = 0
              }
              break

            case "zset":
              try {
                const zsetItems = await kv.zrange(key, 0, -1, { withScores: true })
                value = Array.isArray(zsetItems) ? zsetItems : []
                size = Array.isArray(value) ? value.length / 2 : 0
              } catch (zsetError) {
                console.error(`Error processing zset ${key}:`, getErrorMessage(zsetError))
                value = `Error reading zset: ${getErrorMessage(zsetError)}`
                size = 0
              }
              break

            default:
              value = `Unknown type: ${type}`
              size = 0
          }
        } catch (valueError) {
          console.error(`Error getting value for key ${key}:`, getErrorMessage(valueError))
          value = `Error reading value: ${getErrorMessage(valueError)}`
          type = "error"
        }

        const redisData: RedisData = { key, type, value, size }

        // Categorize the data
        if (key === `business:${businessId}`) {
          structure.coreData.push(redisData)
          // Extract business name if available
          if (type === "string" && typeof value === "string") {
            try {
              const businessData = JSON.parse(value)
              structure.businessName = businessData.businessName || businessData.name
            } catch {
              // Not JSON, ignore
            }
          }
        } else if (key.startsWith(`business:${businessId}:categories`) || key.startsWith("category:")) {
          structure.categories.push(redisData)
        } else if (
          key.startsWith(`business:${businessId}:media`) ||
          key.includes("media") ||
          key.includes("photo") ||
          key.includes("video")
        ) {
          structure.media.push(redisData)
        } else if (
          key.startsWith(`business:${businessId}:zipcode`) ||
          key.startsWith("zipcode:") ||
          key.includes("nationwide")
        ) {
          structure.zipCodes.push(redisData)
        } else if (key.startsWith(`business:${businessId}`)) {
          structure.other.push(redisData)
        } else if (key.includes(businessId)) {
          // Any other key that contains the business ID
          structure.other.push(redisData)
        }
      } catch (err) {
        console.error(`Error processing key ${key}:`, getErrorMessage(err))
        // Add error info to other section
        structure.other.push({
          key,
          type: "error",
          value: `Error: ${getErrorMessage(err)}`,
        })
      }
    }

    return structure
  } catch (error) {
    throw new Error(`Failed to analyze Redis structure: ${getErrorMessage(error)}`)
  }
}

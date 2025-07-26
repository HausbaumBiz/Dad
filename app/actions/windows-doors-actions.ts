"use server"

import { Redis } from "@upstash/redis"
import { getUserSession } from "./user-actions"

// Helper function to safely extract error messages
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  return JSON.stringify(error, Object.getOwnPropertyNames(error))
}

// Helper function to safely parse JSON
function safeJsonParse(data: any, fallback: any = null) {
  try {
    if (typeof data === "string") {
      return JSON.parse(data)
    }
    if (typeof data === "object" && data !== null) {
      return data
    }
    return fallback
  } catch (error) {
    console.error("Error parsing JSON:", getErrorMessage(error))
    return fallback
  }
}

// Helper function to safely ensure array
function ensureArray(data: any, context = ""): any[] {
  console.log(`ensureArray called with data type: ${typeof data}, context: ${context}`, data)

  if (Array.isArray(data)) {
    console.log(`Data is already an array with length: ${data.length}`)
    return data
  }
  if (data === null || data === undefined) {
    console.log(`Data is null/undefined, returning empty array`)
    return []
  }
  if (typeof data === "object") {
    console.log(`Data is object, wrapping in array:`, [data])
    return [data]
  }
  console.log(`Data is primitive type, returning empty array`)
  return []
}

// Initialize Redis connection
function getRedisClient() {
  return new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  })
}

// Try multiple Redis operations to get data regardless of type
async function tryMultipleRedisOperations(key: string): Promise<any> {
  const redis = getRedisClient()

  // Try different Redis operations in order of likelihood
  const operations = [
    { name: "GET", fn: () => redis.get(key) },
    { name: "LRANGE", fn: () => redis.lrange(key, 0, -1) },
    { name: "SMEMBERS", fn: () => redis.smembers(key) },
    { name: "HGETALL", fn: () => redis.hgetall(key) },
  ]

  for (const operation of operations) {
    try {
      console.log(`Trying ${operation.name} for key: ${key}`)
      const result = await operation.fn()

      if (result !== null && result !== undefined) {
        console.log(`✅ ${operation.name} succeeded for key ${key}`)
        return result
      }
    } catch (error) {
      const errorMsg = getErrorMessage(error)
      console.log(`❌ ${operation.name} failed for key ${key}: ${errorMsg}`)

      // If it's not a WRONGTYPE error, something else is wrong
      if (!errorMsg.includes("WRONGTYPE")) {
        console.error(`Non-type error for key ${key}:`, errorMsg)
      }
      continue
    }
  }

  console.log(`All operations failed for key ${key}`)
  return null
}

// Safe Redis get operation with multiple attempts
async function safeRedisGet(key: string): Promise<any> {
  try {
    console.log(`Attempting to get value for key: ${key}`)
    const value = await tryMultipleRedisOperations(key)

    if (value !== null && value !== undefined) {
      console.log(`Successfully retrieved value for key ${key}`)
      return value
    }

    console.log(`No value found for key ${key}`)
    return null
  } catch (error) {
    console.error(`Error getting value for key ${key}:`, getErrorMessage(error))
    return null
  }
}

// Safe Redis set members operation
async function safeRedisSmembers(key: string): Promise<string[]> {
  try {
    const redis = getRedisClient()
    console.log(`Attempting to get set members for key: ${key}`)

    const members = await redis.smembers(key)
    if (Array.isArray(members)) {
      console.log(`Successfully retrieved ${members.length} set members for key ${key}`)
      return members
    }
    return []
  } catch (error) {
    console.error(`Error getting set members for key ${key}:`, getErrorMessage(error))
    return []
  }
}

// Cloudflare Images Configuration
const CLOUDFLARE_ACCOUNT_HASH = "Fx83XHJ2QHIeAJio-AnNbA"

// Generate Cloudflare image URL using public variant
function generateCloudflareImageUrl(imageId: string, variant = "public"): string {
  if (!imageId || typeof imageId !== "string") {
    console.warn("Invalid image ID provided:", imageId)
    return ""
  }

  // Clean the image ID - remove any existing URL parts
  const cleanImageId = imageId.replace(/^.*\/([a-f0-9-]+)\/.*$/, "$1")
  const url = `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}/${cleanImageId}/${variant}`

  console.log(`Generated Cloudflare URL: ${url} from imageId: ${imageId}`)
  return url
}

// Check if URL is already a Cloudflare image URL
function isCloudflareImageUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false
  return url.includes("imagedelivery.net")
}

// Extract image ID from existing Cloudflare URL
function extractImageIdFromUrl(url: string): string | null {
  if (!isCloudflareImageUrl(url)) return null

  try {
    // Match pattern: https://imagedelivery.net/ACCOUNT_HASH/IMAGE_ID/VARIANT
    const match = url.match(/imagedelivery\.net\/[^/]+\/([a-f0-9-]+)\//)
    if (match && match[1]) {
      return match[1]
    }
  } catch (error) {
    console.error("Error extracting image ID from URL:", error)
  }

  return null
}

// Fix Cloudflare image URL to use correct account hash
function fixCloudflareImageUrl(url: string): string {
  if (!isCloudflareImageUrl(url)) return url

  const imageId = extractImageIdFromUrl(url)
  if (!imageId) return url

  return generateCloudflareImageUrl(imageId, "public")
}

// Helper function to process photo data and generate URLs (same as pool-services)
function processPhotoData(photoData: any): string[] {
  const photos: string[] = []

  if (!photoData) return photos

  // Handle array of photos
  if (Array.isArray(photoData)) {
    photoData.forEach((photo: any) => {
      if (typeof photo === "string") {
        // If it's already a URL, use it; otherwise generate Cloudflare URL
        if (photo.startsWith("http")) {
          photos.push(photo)
        } else {
          photos.push(generateCloudflareImageUrl(photo, "public"))
        }
      } else if (photo && typeof photo === "object") {
        // Handle object format
        const imageId = photo.id || photo.imageId || photo.url
        if (imageId) {
          if (imageId.startsWith("http")) {
            photos.push(imageId)
          } else {
            photos.push(generateCloudflareImageUrl(imageId, "public"))
          }
        }
      }
    })
  }
  // Handle single photo object
  else if (typeof photoData === "object") {
    const imageId = photoData.id || photoData.imageId || photoData.url
    if (imageId) {
      if (imageId.startsWith("http")) {
        photos.push(imageId)
      } else {
        photos.push(generateCloudflareImageUrl(imageId, "public"))
      }
    }
  }
  // Handle single photo string
  else if (typeof photoData === "string") {
    if (photoData.startsWith("http")) {
      photos.push(photoData)
    } else {
      photos.push(generateCloudflareImageUrl(photoData, "public"))
    }
  }

  return photos
}

// Enhanced function to load business photos using the same approach as pool-services
export async function loadWindowsDoorsBusinessPhotos(businessId: string): Promise<string[]> {
  try {
    console.log(`Loading photos for business: ${businessId}`)

    const allPhotos: string[] = []

    // List of potential photo keys to check (same as pool-services)
    const photoKeys = [
      `business:${businessId}`,
      `business:${businessId}:media`,
      `business:${businessId}:adDesign`,
      `business:${businessId}:photos`,
      `business:${businessId}:photoAlbum`,
      `business:${businessId}:images`,
      `business:${businessId}:adDesign:businessInfo`,
    ]

    for (const key of photoKeys) {
      try {
        const data = await safeRedisGet(key)

        if (data && typeof data === "object") {
          // Check for photoAlbum field in the data
          if (data.photoAlbum) {
            console.log(`Found photoAlbum in ${key}:`, data.photoAlbum)
            const photos = processPhotoData(data.photoAlbum)
            allPhotos.push(...photos)
          }

          // Check for media.photoAlbum field
          if (data.media && data.media.photoAlbum) {
            console.log(`Found media.photoAlbum in ${key}:`, data.media.photoAlbum)
            const photos = processPhotoData(data.media.photoAlbum)
            allPhotos.push(...photos)
          }

          // Check for adDesign.photoAlbum field
          if (data.adDesign && data.adDesign.photoAlbum) {
            console.log(`Found adDesign.photoAlbum in ${key}:`, data.adDesign.photoAlbum)
            const photos = processPhotoData(data.adDesign.photoAlbum)
            allPhotos.push(...photos)
          }

          // Check for photos field
          if (data.photos) {
            console.log(`Found photos in ${key}:`, data.photos)
            const photos = processPhotoData(data.photos)
            allPhotos.push(...photos)
          }

          // Check for images field
          if (data.images) {
            console.log(`Found images in ${key}:`, data.images)
            const photos = processPhotoData(data.images)
            allPhotos.push(...photos)
          }
        }
        // Handle direct photo data (for keys like business:id:photos)
        else if (data) {
          console.log(`Found direct photo data in ${key}:`, data)
          const photos = processPhotoData(data)
          allPhotos.push(...photos)
        }
      } catch (error) {
        console.log(`No data or error for key ${key}:`, getErrorMessage(error))
        continue
      }
    }

    // Remove duplicates
    const uniquePhotos = [...new Set(allPhotos)]

    console.log(`Total unique photos found for business ${businessId}:`, uniquePhotos.length)
    return uniquePhotos
  } catch (error) {
    console.error("Error loading business photos:", getErrorMessage(error))
    return []
  }
}

// Get businesses for Windows and Doors page
export async function getBusinessesForWindowsDoorsPage() {
  try {
    console.log("🔍 Fetching businesses for Windows and Doors category...")

    // Try multiple possible category keys for windows and doors
    const possibleKeys = [
      "category:windows-doors:businesses",
      "category:home-improvement:windows-doors:businesses",
      "category:Home, Lawn, and Manual Labor:businesses",
    ]

    let businessIds: string[] = []

    for (const categoryKey of possibleKeys) {
      try {
        const ids = await safeRedisSmembers(categoryKey)
        if (ids && ids.length > 0) {
          console.log(`Found ${ids.length} businesses in category: ${categoryKey}`)
          businessIds = ids
          break
        }
      } catch (error) {
        console.log(`No businesses found in category: ${categoryKey}`)
        continue
      }
    }

    if (businessIds.length === 0) {
      console.log("No businesses found in any windows-doors category index")
      return []
    }

    console.log(`Found ${businessIds.length} businesses in category index`)

    const businesses = []
    for (const businessId of businessIds) {
      try {
        const business = await safeRedisGet(`business:${businessId}`)
        if (business && typeof business === "object") {
          // Get subcategories to filter for windows/doors services
          const subcategories =
            (await safeRedisGet(`business:${businessId}:categories`)) ||
            (await safeRedisGet(`business:${businessId}:allSubcategories`)) ||
            []

          let subcategoryArray: any[] = []
          if (Array.isArray(subcategories)) {
            subcategoryArray = subcategories
          } else if (typeof subcategories === "string") {
            const parsed = safeJsonParse(subcategories, [])
            subcategoryArray = ensureArray(parsed)
          }

          // Check if business offers windows/doors services
          const hasWindowsDoorsServices = subcategoryArray.some((subcat) => {
            const path = typeof subcat === "string" ? subcat : subcat?.fullPath || subcat?.name || ""
            const windowsDoorsKeywords = [
              "window",
              "door",
              "glass",
              "glazing",
              "locksmith",
              "security film",
              "tinting",
              "curtain",
              "blind",
              "drapery",
            ]
            return windowsDoorsKeywords.some((keyword) => path.toLowerCase().includes(keyword.toLowerCase()))
          })

          if (hasWindowsDoorsServices) {
            businesses.push({
              id: businessId,
              ...business,
              displayName: (business as any).businessName || (business as any).name || `Business ${businessId}`,
              displayPhone: (business as any).phone || "Phone not available",
              displayLocation: (business as any).address || (business as any).location || "Location not available",
              subcategories: subcategoryArray,
            })
          }
        }
      } catch (error) {
        console.error(`Error loading business ${businessId}:`, error)
      }
    }

    console.log(`✅ Successfully loaded ${businesses.length} windows/doors businesses`)
    return businesses
  } catch (error) {
    console.error("Error fetching businesses for Windows and Doors:", error)
    return []
  }
}

// Get business reviews with defensive Redis operations
export async function getWindowsDoorsBusinessReviews(businessId: string): Promise<any[]> {
  try {
    console.log(`🔍 Loading reviews for business ${businessId}`)

    // Use safe Redis operations to handle WRONGTYPE errors
    const reviewsData = await safeRedisGet(`business:${businessId}:reviews`)

    if (!reviewsData) {
      console.log(`No reviews found for business ${businessId}`)
      return []
    }

    // Handle different data types
    if (Array.isArray(reviewsData)) {
      console.log(`Found ${reviewsData.length} reviews as array for business ${businessId}`)
      return reviewsData
    }

    if (typeof reviewsData === "string") {
      const reviews = safeJsonParse(reviewsData, [])
      const reviewArray = ensureArray(reviews)
      console.log(`Found ${reviewArray.length} reviews as JSON string for business ${businessId}`)
      return reviewArray
    }

    if (typeof reviewsData === "object" && reviewsData !== null) {
      // If it's a single review object, wrap it in an array
      console.log(`Found single review object for business ${businessId}`)
      return [reviewsData]
    }

    console.log(`Reviews data is not in expected format for business ${businessId}`)
    return []
  } catch (error) {
    console.error(`❌ Error loading reviews for business ${businessId}:`, getErrorMessage(error))
    return []
  }
}

// Check if business is favorite
export async function checkWindowsDoorsBusinessIsFavorite(businessId: string) {
  try {
    const session = await getUserSession()
    if (!session?.user) {
      return false
    }

    const favorites = await safeRedisGet(`user:${session.user.id}:favorites`)
    if (!Array.isArray(favorites)) {
      return false
    }

    return favorites.some((fav) => fav.id === businessId)
  } catch (error) {
    console.error("Error checking if business is favorite:", error)
    return false
  }
}

// Add business to favorites
export async function addWindowsDoorsBusinessToFavorites(business: any) {
  try {
    const session = await getUserSession()
    if (!session?.user) {
      return { success: false, message: "Please log in to save businesses" }
    }

    const userId = session.user.id
    const favorites = (await safeRedisGet(`user:${userId}:favorites`)) || []
    const favoritesArray = Array.isArray(favorites) ? favorites : []

    // Check if already exists
    const exists = favoritesArray.some((fav) => fav.id === business.id)
    if (exists) {
      return { success: false, message: "Business already in favorites" }
    }

    // Add to favorites
    favoritesArray.push({
      id: business.id,
      businessName: business.businessName,
      displayName: business.displayName,
      phone: business.phone,
      email: business.email,
      address: business.address,
      zipCode: business.zipCode,
      addedAt: Date.now(),
    })

    const redis = getRedisClient()
    await redis.set(`user:${userId}:favorites`, JSON.stringify(favoritesArray))

    return { success: true, message: "Business saved to favorites!" }
  } catch (error) {
    console.error("Error adding business to favorites:", error)
    return { success: false, message: "Failed to save business" }
  }
}

// Get user session
export async function getWindowsDoorsUserSession() {
  try {
    return await getUserSession()
  } catch (error) {
    console.error("Error getting user session:", error)
    return null
  }
}

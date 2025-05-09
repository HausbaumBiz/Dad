/**
 * Utility functions for interacting with Cloudflare Stream API
 */

// Environment variables for Cloudflare credentials
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN

// Base URL for Cloudflare Stream API
const CLOUDFLARE_API_BASE = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`

// API headers for authentication
const headers = {
  Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
}

/**
 * Get a direct upload URL from Cloudflare Stream
 */
export async function getDirectUploadUrl(): Promise<{
  success: boolean
  uploadUrl?: string
  id?: string
  error?: string
}> {
  try {
    const response = await fetch(`${CLOUDFLARE_API_BASE}/direct_upload`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        maxDurationSeconds: 3600, // 1 hour max video length
        expiry: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour expiry for upload URL
        requireSignedURLs: false, // Set to true for more security in production
      }),
    })

    if (!response.ok) {
      let errorMessage = `Cloudflare API error: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        console.error("Cloudflare direct upload error:", errorData)
        if (errorData.errors && errorData.errors.length > 0) {
          errorMessage = `Cloudflare API error: ${errorData.errors[0].message}`
        }
      } catch (e) {
        // If JSON parsing fails, just use the HTTP status
        console.error("Failed to parse error response:", e)
      }

      return {
        success: false,
        error: errorMessage,
      }
    }

    const data = await response.json()
    if (!data.success || !data.result) {
      return {
        success: false,
        error: "Failed to get upload URL from Cloudflare",
      }
    }

    return {
      success: true,
      uploadUrl: data.result.uploadURL,
      id: data.result.uid,
    }
  } catch (error) {
    console.error("Error getting direct upload URL:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Get video details from Cloudflare Stream
 */
export async function getVideoDetails(videoId: string): Promise<{
  success: boolean
  video?: any
  error?: string
}> {
  try {
    // Add logging to help debug
    console.log(`Fetching video details for ID: ${videoId}`)

    const response = await fetch(`${CLOUDFLARE_API_BASE}/${videoId}`, {
      method: "GET",
      headers,
    })

    if (!response.ok) {
      let errorMessage = `Cloudflare API error: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        if (errorData.errors && errorData.errors.length > 0) {
          errorMessage = `Cloudflare API error: ${errorData.errors[0].message}`
        }
      } catch (e) {
        // If JSON parsing fails, just use the HTTP status
      }

      console.error(`Error fetching video details: ${errorMessage}`)
      return {
        success: false,
        error: errorMessage,
      }
    }

    let data
    try {
      data = await response.json()
    } catch (e) {
      console.error("Failed to parse response as JSON:", e)
      return {
        success: false,
        error: "Invalid response from Cloudflare API",
      }
    }

    if (!data.success || !data.result) {
      console.error("Failed to get video details from Cloudflare:", data)
      return {
        success: false,
        error: "Failed to get video details from Cloudflare",
      }
    }

    // Extract the status and handle it properly
    const videoData = data.result

    // Log the video data for debugging
    console.log("Cloudflare video data:", {
      id: videoData.uid,
      status: videoData.status,
      readyToStream: videoData.readyToStream,
      created: videoData.created,
    })

    // If status is an object, convert it to a string representation
    if (videoData.status && typeof videoData.status === "object") {
      videoData.status = JSON.stringify(videoData.status)
    }

    return {
      success: true,
      video: videoData,
    }
  } catch (error) {
    console.error("Error getting video details:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Delete a video from Cloudflare Stream
 */
export async function deleteVideo(videoId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Check if videoId is valid
    if (!videoId || typeof videoId !== "string" || videoId.trim() === "") {
      return {
        success: false,
        error: "Invalid video ID",
      }
    }

    const response = await fetch(`${CLOUDFLARE_API_BASE}/${videoId}`, {
      method: "DELETE",
      headers,
    })

    // If the video doesn't exist, consider it a success (already deleted)
    if (response.status === 404) {
      console.log(`Video ${videoId} not found, considering delete successful`)
      return { success: true }
    }

    if (!response.ok) {
      let errorMessage = `Cloudflare API error: ${response.status} ${response.statusText}`
      try {
        const text = await response.text()
        if (text) {
          try {
            const errorData = JSON.parse(text)
            if (errorData.errors && errorData.errors.length > 0) {
              errorMessage = `Cloudflare API error: ${errorData.errors[0].message}`
            }
          } catch (parseError) {
            console.error("Failed to parse error response:", parseError)
            errorMessage = `Cloudflare API error: ${response.status} ${response.statusText} - ${text}`
          }
        }
      } catch (e) {
        console.error("Failed to read response text:", e)
      }

      return {
        success: false,
        error: errorMessage,
      }
    }

    // Try to parse the response as JSON, but handle empty responses
    let data
    try {
      const text = await response.text()
      data = text ? JSON.parse(text) : { success: true }
    } catch (e) {
      console.error("Failed to parse delete response:", e)
      // If we can't parse the response but the HTTP status was OK,
      // we'll assume the deletion was successful
      if (response.ok) {
        return { success: true }
      }
      return {
        success: false,
        error: "Invalid response from Cloudflare API",
      }
    }

    return {
      success: data.success !== false, // Default to true if success field is missing
    }
  } catch (error) {
    console.error("Error deleting video:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Construct a Cloudflare Stream player URL
 */
export function getStreamUrl(videoId: string): string {
  return `https://customer-${CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${videoId}/manifest/video.m3u8`
}

/**
 * Construct a Cloudflare Stream thumbnail URL
 */
export function getThumbnailUrl(videoId: string, time = 0): string {
  return `https://customer-${CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg?time=${time}s`
}

/**
 * Check if Cloudflare Stream is configured properly
 */
export async function checkCloudflareConfig(): Promise<{
  success: boolean
  configured: boolean
  error?: string
}> {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    return {
      success: false,
      configured: false,
      error: "Cloudflare credentials are missing",
    }
  }

  try {
    // Make a simple request to verify credentials
    const response = await fetch(`${CLOUDFLARE_API_BASE}`, {
      method: "GET",
      headers,
    })

    if (!response.ok) {
      let errorMessage = `Cloudflare API error: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        if (errorData.errors && errorData.errors.length > 0) {
          errorMessage = `Cloudflare API error: ${errorData.errors[0].message}`
        }
      } catch (e) {
        // If JSON parsing fails, just use the HTTP status
      }

      return {
        success: false,
        configured: false,
        error: errorMessage,
      }
    }

    return {
      success: true,
      configured: true,
    }
  } catch (error) {
    console.error("Error checking Cloudflare config:", error)
    return {
      success: false,
      configured: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

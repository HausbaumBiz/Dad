/**
 * Utility functions for interacting with Cloudflare Images API
 */

// Environment variables for Cloudflare credentials
export const CLOUDFLARE_ACCOUNT_ID = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID || ""
export const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || ""

// Add this export at the top of the file, after the other exports
export const CLOUDFLARE_ACCOUNT_HASH = "Fx83XHJ2QHIeAJio-AnNbA"

// Base URL for Cloudflare Images API
const CLOUDFLARE_API_BASE = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`

// API headers for authentication
const headers = {
  Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
}

/**
 * Generate a Cloudflare image URL from an image ID
 * @param imageId The Cloudflare image ID
 * @param variant The image variant (default: "public")
 * @returns The full Cloudflare image URL
 */
export function getCloudflareImageUrl(imageId: string, variant = "public"): string {
  if (!CLOUDFLARE_ACCOUNT_HASH) {
    console.error("Cloudflare account hash not configured")
    return ""
  }
  return `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}/${imageId}/${variant}`
}

/**
 * Check if a URL is a Cloudflare image URL
 * @param url The URL to check
 * @returns True if the URL is a Cloudflare image URL
 */
export function isCloudflareImageUrl(url: string): boolean {
  if (!url) return false
  return url.includes("imagedelivery.net")
}

/**
 * Extract the image ID from a Cloudflare image URL
 * @param url The Cloudflare image URL
 * @returns The image ID or null if not found
 */
export function extractImageIdFromUrl(url: string): string | null {
  if (!isCloudflareImageUrl(url)) return null

  try {
    // URL format: https://imagedelivery.net/ACCOUNT_HASH/IMAGE_ID/VARIANT
    const parts = url.split("/")
    if (parts.length >= 5) {
      return parts[4] // The image ID is the 5th part (index 4)
    }
  } catch (error) {
    console.error("Error extracting image ID from URL:", error)
  }

  return null
}

/**
 * Delete an image from Cloudflare Images
 */
export async function deleteFromCloudflareImages(imageId: string): Promise<boolean> {
  try {
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
      console.error("Cloudflare credentials not configured")
      return false
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1/${imageId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Cloudflare delete error (${response.status}):`, errorText)
      return false
    }

    const result = await response.json()

    return result.success === true
  } catch (error) {
    console.error("Error deleting from Cloudflare Images:", error)
    return false
  }
}

// Update the uploadToCloudflareImages function to properly handle base64 strings
export async function uploadToCloudflareImages(
  imageData: any,
  metadata: Record<string, any>,
  filename: string,
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
      return { success: false, error: "Cloudflare credentials not configured" }
    }

    const formData = new FormData()

    // Handle base64 string input
    if (typeof imageData === "string" && imageData.includes("base64")) {
      // Convert base64 to blob
      const base64Response = await fetch(imageData)
      const blob = await base64Response.blob()
      formData.append("file", blob, filename)
    }
    // Handle buffer input
    else if (imageData instanceof Blob) {
      formData.append("file", imageData, filename)
    } else {
      return { success: false, error: "Invalid image data format" }
    }

    if (Object.keys(metadata).length > 0) {
      formData.append("metadata", JSON.stringify(metadata))
    }

    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
      body: formData as any,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Cloudflare upload error (${response.status}):`, errorText)
      return { success: false, error: `Failed to upload image: ${response.statusText}` }
    }

    const result = await response.json()

    if (!result.success) {
      console.error("Cloudflare upload error:", result.errors)
      return { success: false, error: result.errors?.[0]?.message || "Upload failed" }
    }

    return { success: true, result: result.result }
  } catch (error) {
    console.error("Error uploading to Cloudflare Images:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Convert Cloudflare image data to MediaItem format
 */

export interface MediaItem {
  id: string
  url: string
  filename: string
  contentType: string
  size: number
  width: number
  height: number
  createdAt: string
}

export function cloudflareImageToMediaItem(image: any): MediaItem {
  return {
    id: image.id,
    url: getCloudflareImageUrl(image.id),
    filename: image.filename,
    contentType: image.contentType,
    size: image.size,
    width: image.width,
    height: image.height,
    createdAt: image.uploaded,
  }
}

export async function listCloudflareImages(): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
      return { success: false, error: "Cloudflare credentials not configured" }
    }

    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Cloudflare list error (${response.status}):`, errorText)
      return { success: false, error: `Failed to list images: ${response.statusText}` }
    }

    const result = await response.json()

    if (!result.success) {
      console.error("Cloudflare list error:", result.errors)
      return { success: false, error: result.errors?.[0]?.message || "List failed" }
    }

    return { success: true, result: result.result }
  } catch (error) {
    console.error("Error listing Cloudflare Images:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

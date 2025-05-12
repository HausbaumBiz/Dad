"use server"

import { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } from "@/lib/constants"
import type { MediaItem } from "./definitions"

/**
 * Upload an image to Cloudflare Images
 */
export async function uploadToCloudflareImages(
  imageBuffer: Buffer | File,
  metadata: Record<string, any>,
  filename: string,
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
      return { success: false, error: "Cloudflare credentials not configured" }
    }

    // Create form data for the upload
    const formData = new FormData()

    // Handle different types of image data
    if (imageBuffer instanceof File) {
      // If it's already a File, just append it
      formData.append("file", imageBuffer)
    } else if (Buffer.isBuffer(imageBuffer)) {
      // If it's a Node.js Buffer, convert it to a Blob first
      // Note: In browser environments, we need to create a Blob
      const blob = new Blob([new Uint8Array(imageBuffer)], { type: "image/png" })
      formData.append("file", blob, filename || "image.png")
    } else if (imageBuffer instanceof Uint8Array) {
      // Handle Uint8Array case
      const blob = new Blob([imageBuffer], { type: "image/png" })
      formData.append("file", blob, filename || "image.png")
    } else {
      // Handle base64 string case
      if (typeof imageBuffer === "string" && imageBuffer.startsWith("data:")) {
        // Extract base64 data from data URL
        const base64Data = imageBuffer.split(",")[1]
        const binaryString = atob(base64Data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const blob = new Blob([bytes], { type: "image/png" })
        formData.append("file", blob, filename || "image.png")
      } else {
        return { success: false, error: "Unsupported image format" }
      }
    }

    // Add metadata
    if (Object.keys(metadata).length > 0) {
      formData.append("metadata", JSON.stringify(metadata))
    }

    // Make the API request
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
      body: formData,
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
 * Delete an image from Cloudflare Images
 */
export async function deleteFromCloudflareImages(imageId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
      return { success: false, error: "Cloudflare credentials not configured" }
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
      return { success: false, error: `Failed to delete image: ${response.statusText}` }
    }

    const result = await response.json()

    if (!result.success) {
      console.error("Cloudflare delete error:", result.errors)
      return { success: false, error: result.errors?.[0]?.message || "Delete failed" }
    }

    return { success: true }
  } catch (error) {
    console.error("Error deleting from Cloudflare Images:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * List images from Cloudflare Images
 */
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

/**
 * Generate a Cloudflare image URL from an image ID
 */
export async function getCloudflareImageUrl(imageId: string, variant = "public"): Promise<string> {
  if (!CLOUDFLARE_ACCOUNT_ID) {
    console.error("Cloudflare account ID not configured")
    return ""
  }
  return `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_ID}/${imageId}/${variant}`
}

/**
 * Convert Cloudflare image to MediaItem
 */
export async function cloudflareImageToMediaItem(image: any): Promise<MediaItem> {
  const imageUrl = await getCloudflareImageUrl(image.id)
  return {
    id: image.id,
    url: imageUrl,
    filename: image.filename || "Untitled",
    contentType: image.contentType || "image/jpeg",
    size: image.size,
    width: image.width,
    height: image.height,
    createdAt: image.uploaded,
  }
}

// Export the account hash
export const CLOUDFLARE_ACCOUNT_HASH = CLOUDFLARE_ACCOUNT_ID

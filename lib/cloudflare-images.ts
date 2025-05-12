/**
 * Utility functions for interacting with Cloudflare Images API
 */

// Cloudflare Images API endpoints
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN
const CF_IMAGES_BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1`
const CF_IMAGES_DELIVERY_URL = `https://imagedelivery.net/${CF_ACCOUNT_ID}`

// Types for Cloudflare Images
export type CloudflareImageMetadata = {
  id: string
  filename: string
  uploaded: string
  requireSignedURLs: boolean
  variants: string[]
  meta?: {
    businessId?: string
    originalSize?: number
    width?: number
    height?: number
    label?: string
    sortOrder?: number
    tags?: string[]
    folderId?: string
  }
}

export type CloudflareImageUploadResult = {
  result: CloudflareImageMetadata
  success: boolean
  errors: any[]
  messages: any[]
}

export type CloudflareImagesListResult = {
  result: {
    images: CloudflareImageMetadata[]
  }
  success: boolean
  errors: any[]
  messages: any[]
}

/**
 * Upload an image to Cloudflare Images
 */
export async function uploadToCloudflareImages(
  file: File | Buffer,
  metadata: Record<string, any> = {},
  filename?: string,
): Promise<CloudflareImageUploadResult | null> {
  try {
    // Create form data for the upload
    const formData = new FormData()

    if (file instanceof File) {
      formData.append("file", file)
    } else {
      // If it's a Buffer, create a Blob and append it
      const blob = new Blob([file])
      formData.append("file", blob, filename || "image.jpg")
    }

    // Add metadata
    if (Object.keys(metadata).length > 0) {
      formData.append("metadata", JSON.stringify(metadata))
    }

    // Make the API request
    const response = await fetch(CF_IMAGES_BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Cloudflare Images upload failed:", errorText)
      return null
    }

    const result = (await response.json()) as CloudflareImageUploadResult
    return result
  } catch (error) {
    console.error("Error uploading to Cloudflare Images:", error)
    return null
  }
}

/**
 * Delete an image from Cloudflare Images
 */
export async function deleteFromCloudflareImages(imageId: string): Promise<boolean> {
  try {
    const response = await fetch(`${CF_IMAGES_BASE_URL}/${imageId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Cloudflare Images delete failed:", errorText)
      return false
    }

    const result = await response.json()
    return result.success
  } catch (error) {
    console.error("Error deleting from Cloudflare Images:", error)
    return false
  }
}

/**
 * List images from Cloudflare Images
 */
export async function listCloudflareImages(page = 1, perPage = 100): Promise<CloudflareImagesListResult | null> {
  try {
    const response = await fetch(`${CF_IMAGES_BASE_URL}?page=${page}&per_page=${perPage}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Cloudflare Images list failed:", errorText)
      return null
    }

    const result = (await response.json()) as CloudflareImagesListResult
    return result
  } catch (error) {
    console.error("Error listing Cloudflare Images:", error)
    return null
  }
}

/**
 * Get image details from Cloudflare Images
 */
export async function getCloudflareImageDetails(imageId: string): Promise<CloudflareImageMetadata | null> {
  try {
    const response = await fetch(`${CF_IMAGES_BASE_URL}/${imageId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Cloudflare Images get details failed:", errorText)
      return null
    }

    const result = await response.json()
    return result.result
  } catch (error) {
    console.error("Error getting Cloudflare Image details:", error)
    return null
  }
}

/**
 * Update image metadata in Cloudflare Images
 */
export async function updateCloudflareImageMetadata(
  imageId: string,
  metadata: Record<string, any>,
): Promise<CloudflareImageMetadata | null> {
  try {
    const response = await fetch(`${CF_IMAGES_BASE_URL}/${imageId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ metadata }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Cloudflare Images update metadata failed:", errorText)
      return null
    }

    const result = await response.json()
    return result.result
  } catch (error) {
    console.error("Error updating Cloudflare Image metadata:", error)
    return null
  }
}

/**
 * Get a Cloudflare Images delivery URL
 */
export function getCloudflareImageUrl(imageId: string, variant = "public"): string {
  return `${CF_IMAGES_DELIVERY_URL}/${imageId}/${variant}`
}

/**
 * Convert a Cloudflare Image to our MediaItem format
 */
export function cloudflareImageToMediaItem(image: CloudflareImageMetadata): any {
  return {
    id: image.id,
    url: getCloudflareImageUrl(image.id),
    filename: image.filename,
    contentType: "image/jpeg", // Cloudflare doesn't return content type
    size: image.meta?.originalSize || 0,
    width: image.meta?.width,
    height: image.meta?.height,
    createdAt: image.uploaded,
    folderId: image.meta?.folderId,
    tags: image.meta?.tags,
    label: image.meta?.label,
    sortOrder: image.meta?.sortOrder,
  }
}

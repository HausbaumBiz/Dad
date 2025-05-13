"use server"

import { CLOUDFLARE_ACCOUNT_HASH } from "@/lib/cloudflare-images"

/**
 * Generate a Cloudflare delivery URL for an image
 *
 * @param imageId The Cloudflare image ID
 * @returns A properly formatted Cloudflare delivery URL
 */
export async function getCloudflareDeliveryUrl(imageId: string): Promise<string> {
  if (!imageId) {
    console.error("No image ID provided to getCloudflareDeliveryUrl")
    return ""
  }

  if (!CLOUDFLARE_ACCOUNT_HASH) {
    console.error("Cloudflare account hash not configured")
    return ""
  }

  // Use the public URL format that works
  const url = `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}/${imageId}/public`
  console.log(`Generated Cloudflare delivery URL: ${url}`)

  return url
}

/**
 * Fetch image metadata from Cloudflare
 *
 * @param imageId The Cloudflare image ID
 * @returns Image metadata or null if not found
 */
export async function getCloudflareImageMetadata(imageId: string): Promise<any | null> {
  try {
    if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID) {
      console.error("Cloudflare credentials not configured")
      return null
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1/${imageId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        },
      },
    )

    if (!response.ok) {
      console.error(`Failed to fetch image metadata: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()
    return data.success ? data.result : null
  } catch (error) {
    console.error("Error fetching image metadata:", error)
    return null
  }
}

/**
 * Check if a Cloudflare image exists
 *
 * @param imageId The Cloudflare image ID
 * @returns True if the image exists
 */
export async function checkCloudflareImageExists(imageId: string): Promise<boolean> {
  const metadata = await getCloudflareImageMetadata(imageId)
  return !!metadata
}

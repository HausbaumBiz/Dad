// Make sure the getCloudflareImageUrl function is properly defined and exported

import { CLOUDFLARE_ACCOUNT_HASH } from "@/lib/cloudflare-images"

/**
 * Generate a Cloudflare image URL from an image ID
 * @param imageId The Cloudflare image ID
 * @param variant The image variant (default: "public")
 * @returns The full Cloudflare image URL
 */
export function getCloudflareImageUrl(imageId: string, variant = "public"): string {
  if (!imageId) return ""

  // Use the CLOUDFLARE_ACCOUNT_HASH from the imported constant
  // This ensures consistency across the application
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
 * Fix a Cloudflare image URL if it's using an incorrect account hash
 * @param url The Cloudflare image URL to fix
 * @returns The fixed URL or the original if it's not a Cloudflare image URL
 */
export function fixCloudflareImageUrl(url: string): string {
  if (!isCloudflareImageUrl(url)) return url

  const imageId = extractImageIdFromUrl(url)
  if (!imageId) return url

  return getCloudflareImageUrl(imageId)
}

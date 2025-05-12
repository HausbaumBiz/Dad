/**
 * Utility functions for working with Cloudflare Images
 */

// The correct Cloudflare account hash
export const CLOUDFLARE_ACCOUNT_HASH = "Fx83XHJ2QHIeAJio-AnNbA"

/**
 * Generates a Cloudflare Images URL with the correct account hash
 * @param imageId The Cloudflare image ID
 * @param variant The variant name (default: "public")
 * @returns The complete Cloudflare Images URL
 */
export function getCloudflareImageUrl(imageId: string, variant = "public"): string {
  return `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}/${imageId}/${variant}`
}

/**
 * Checks if a URL is a Cloudflare Images URL
 * @param url The URL to check
 * @returns True if the URL is a Cloudflare Images URL
 */
export function isCloudflareImageUrl(url: string): boolean {
  return url.includes("imagedelivery.net")
}

/**
 * Extracts the image ID from a Cloudflare Images URL
 * @param url The Cloudflare Images URL
 * @returns The image ID or null if not found
 */
export function extractImageIdFromUrl(url: string): string | null {
  if (!isCloudflareImageUrl(url)) return null

  // URL format: https://imagedelivery.net/ACCOUNT_HASH/IMAGE_ID/VARIANT
  const parts = url.split("/")
  if (parts.length >= 5) {
    return parts[4]
  }

  return null
}

/**
 * Fixes a Cloudflare Images URL to use the correct account hash
 * @param url The original URL
 * @returns The fixed URL
 */
export function fixCloudflareImageUrl(url: string): string {
  if (!isCloudflareImageUrl(url)) return url

  const imageId = extractImageIdFromUrl(url)
  if (!imageId) return url

  // Extract the variant (last part of the URL)
  const parts = url.split("/")
  const variant = parts[parts.length - 1]

  return getCloudflareImageUrl(imageId, variant)
}

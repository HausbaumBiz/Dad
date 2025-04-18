/**
 * Image optimization utilities to replace Next.js built-in optimization
 */

// Image quality settings
export const IMAGE_QUALITY = {
  HIGH: 85,
  MEDIUM: 70,
  LOW: 60,
  THUMBNAIL: 50,
}

// Common image sizes
export const IMAGE_SIZES = {
  THUMBNAIL: { width: 100, height: 100 },
  SMALL: { width: 300, height: 300 },
  MEDIUM: { width: 600, height: 600 },
  LARGE: { width: 1200, height: 1200 },
}

/**
 * Generates a responsive image URL with proper dimensions
 * @param src Original image source
 * @param width Desired width
 * @param height Desired height (optional)
 * @returns Optimized image URL
 */
export function getResponsiveImageUrl(src: string, width: number, height?: number): string {
  // If using a placeholder, generate a proper sized one
  if (src.startsWith("/placeholder.svg")) {
    return `/placeholder.svg?width=${width}&height=${height || width}`
  }

  // For external images, you could use an image CDN here
  // Example: return `https://your-image-cdn.com/${encodeURIComponent(src)}?width=${width}&quality=${IMAGE_QUALITY.HIGH}`;

  // For local images, return the original (assuming they're pre-optimized)
  return src
}

/**
 * Calculates the aspect ratio for an image
 * @param width Original width
 * @param height Original height
 * @returns CSS aspect ratio value
 */
export function getAspectRatio(width: number, height: number): string {
  return `${width} / ${height}`
}

/**
 * Generates a blurred placeholder data URL for an image
 * Note: In a real implementation, you would pre-generate these
 * @param color Background color for placeholder
 * @returns SVG data URL
 */
export function getBlurDataUrl(color = "e2e8f0"): string {
  return `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect width='1' height='1' fill='%23${color}'/%3E%3C/svg%3E`
}

/**
 * Determines if an image should be lazy loaded
 * @param priority Whether the image is high priority
 * @param viewport Whether the image is in the viewport
 * @returns Loading strategy ('lazy' or 'eager')
 */
export function getLoadingStrategy(priority: boolean, viewport: boolean): "lazy" | "eager" {
  if (priority || viewport) {
    return "eager"
  }
  return "lazy"
}

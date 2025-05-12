/**
 * Utility functions for media-related operations
 */
import imageCompression from "browser-image-compression"

/**
 * Create a preview URL for a file
 */
export async function createPreviewUrl(file: File): Promise<string> {
  return URL.createObjectURL(file)
}

/**
 * Format a file size in bytes to a human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

/**
 * Check if a file is a valid image
 */
export function isValidImage(file: File): boolean {
  const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
  return validTypes.includes(file.type)
}

/**
 * Check if a file is a valid video
 */
export function isValidVideo(file: File): boolean {
  const validTypes = ["video/mp4", "video/quicktime", "video/x-m4v", "video/webm"]
  return validTypes.includes(file.type)
}

/**
 * Check if a file is within the size limit
 */
export function isWithinSizeLimit(file: File, maxSizeMB: number): boolean {
  return file.size <= maxSizeMB * 1024 * 1024
}

/**
 * Create FormData object for media upload
 */
export function createMediaFormData(
  file: File,
  businessId: string,
  type: "video" | "thumbnail" | "photo",
  designId?: string,
): FormData {
  const formData = new FormData()
  formData.append("businessId", businessId)
  formData.append(type, file)

  if (designId) {
    formData.append("designId", designId)
  }

  return formData
}

/**
 * Compress an image file using browser-image-compression
 * @param file The image file to compress
 * @param quality Quality level (0-1)
 * @param maxDimension Maximum width or height in pixels
 */
export async function compressImage(file: File, quality = 0.8, maxDimension = 1920): Promise<File> {
  try {
    // Skip compression for small files or non-images
    if (file.size < 100 * 1024 || !isValidImage(file)) {
      return file
    }

    // Target size in MB (600 KB = 0.6 MB)
    const targetSizeMB = 0.6

    const options = {
      maxSizeMB: targetSizeMB,
      maxWidthOrHeight: maxDimension,
      useWebWorker: true,
      fileType: file.type,
      quality,
    }

    // First compression attempt
    let compressedFile = await imageCompression(file, options)

    // If still over 600 KB, try more aggressive compression
    if (compressedFile.size > targetSizeMB * 1024 * 1024) {
      const moreAggressiveOptions = {
        ...options,
        quality: quality * 0.8, // Reduce quality further
        maxWidthOrHeight: Math.min(1200, maxDimension), // Reduce dimensions if they're larger
      }
      compressedFile = await imageCompression(compressedFile, moreAggressiveOptions)

      // If still over limit, try one final aggressive compression
      if (compressedFile.size > targetSizeMB * 1024 * 1024) {
        const finalOptions = {
          ...options,
          quality: 0.6,
          maxWidthOrHeight: 1000,
        }
        compressedFile = await imageCompression(compressedFile, finalOptions)
      }
    }

    // Create a new file with the original name but compressed data
    return new File([compressedFile], file.name, { type: file.type })
  } catch (error) {
    console.error("Error compressing image:", error)
    return file // Return original if compression fails
  }
}

/**
 * Calculate compression savings
 */
export function calculateCompressionSavings(
  originalSize: number,
  compressedSize: number,
): { bytes: number; percentage: number } {
  const bytes = originalSize - compressedSize
  const percentage = Math.round((bytes / originalSize) * 100)

  return { bytes, percentage }
}

/**
 * Get recommended quality based on file size
 */
export function getRecommendedQuality(fileSize: number): number {
  const sizeMB = fileSize / (1024 * 1024)

  if (sizeMB > 5) return 0.6
  if (sizeMB > 2) return 0.7
  if (sizeMB > 1) return 0.8

  return 0.9
}

/**
 * Get recommended max dimension based on image type
 */
export function getRecommendedMaxDimension(type: "photo" | "thumbnail"): number {
  return type === "photo" ? 1920 : 800
}

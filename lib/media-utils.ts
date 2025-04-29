/**
 * Utility functions for client-side media operations
 */
import imageCompression from "browser-image-compression"

/**
 * Convert a File object to a FormData object for upload
 */
export function createMediaFormData(
  file: File,
  businessId: string,
  type: "video" | "thumbnail" | "photo",
  designId?: string,
) {
  const formData = new FormData()
  formData.append("businessId", businessId)
  formData.append(type, file)

  if (designId) {
    formData.append("designId", designId)
  }

  return formData
}

/**
 * Get file size in a human-readable format
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
  const validTypes = ["video/mp4", "video/quicktime", "video/x-m4v", "video/3gpp"]
  return validTypes.includes(file.type)
}

/**
 * Check if a file is within size limits
 */
export function isWithinSizeLimit(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

/**
 * Create a preview URL for a file
 */
export function createPreviewUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      resolve(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Compress an image file in the browser before upload
 * @param imageFile The original image file
 * @param quality Quality level (0-1) where 1 is highest quality
 * @param maxWidthOrHeight Maximum width or height in pixels
 */
export async function compressImage(imageFile: File, quality = 0.8, maxWidthOrHeight = 1920): Promise<File> {
  try {
    const options = {
      maxSizeMB: 0.6, // Target 600KB
      maxWidthOrHeight,
      useWebWorker: true,
      fileType: imageFile.type,
      quality,
    }

    const compressedFile = await imageCompression(imageFile, options)

    // Create a new file with the original name but compressed data
    return new File([compressedFile], imageFile.name, { type: imageFile.type })
  } catch (error) {
    console.error("Error compressing image:", error)
    return imageFile // Return original if compression fails
  }
}

/**
 * Compress any image to ensure it's under 600KB for blob storage
 */
export async function compressForBlobStorage(imageFile: File): Promise<{
  file: File
  originalSize: number
  compressedSize: number
  percentSaved: number
}> {
  try {
    const originalSize = imageFile.size

    // Skip compression if already under target size
    if (originalSize <= 600 * 1024) {
      return {
        file: imageFile,
        originalSize,
        compressedSize: originalSize,
        percentSaved: 0,
      }
    }

    // First compression attempt with reasonable quality
    const options = {
      maxSizeMB: 0.6, // 600KB
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: imageFile.type,
      quality: 0.8,
    }

    let compressedFile = await imageCompression(imageFile, options)

    // If still too large, try more aggressive compression
    if (compressedFile.size > 600 * 1024) {
      options.quality = 0.6
      options.maxWidthOrHeight = 1600
      compressedFile = await imageCompression(imageFile, options)

      // If still too large, try one more time
      if (compressedFile.size > 600 * 1024) {
        options.quality = 0.4
        options.maxWidthOrHeight = 1200
        compressedFile = await imageCompression(imageFile, options)
      }
    }

    // Create a new file with the original name but compressed data
    const finalFile = new File([compressedFile], imageFile.name, { type: imageFile.type })

    // Calculate percentage saved
    const percentSaved = Math.round(((originalSize - finalFile.size) / originalSize) * 100)

    return {
      file: finalFile,
      originalSize,
      compressedSize: finalFile.size,
      percentSaved,
    }
  } catch (error) {
    console.error("Error compressing image for blob storage:", error)
    // Return original if compression fails
    return {
      file: imageFile,
      originalSize: imageFile.size,
      compressedSize: imageFile.size,
      percentSaved: 0,
    }
  }
}

/**
 * Calculate compression savings
 */
export function calculateCompressionSavings(
  originalSize: number,
  compressedSize: number,
): {
  percentage: number
  savedBytes: number
} {
  const savedBytes = originalSize - compressedSize
  const percentage = (savedBytes / originalSize) * 100

  return {
    percentage: Math.round(percentage),
    savedBytes,
  }
}

/**
 * Get appropriate quality setting based on file size
 */
export function getRecommendedQuality(fileSizeInBytes: number): number {
  // Adjust quality based on file size
  if (fileSizeInBytes > 10 * 1024 * 1024) {
    // > 10MB
    return 0.6 // Lower quality for very large files
  } else if (fileSizeInBytes > 5 * 1024 * 1024) {
    // > 5MB
    return 0.7
  } else if (fileSizeInBytes > 2 * 1024 * 1024) {
    // > 2MB
    return 0.8
  } else {
    return 0.9 // Higher quality for smaller files
  }
}

/**
 * Get appropriate max dimension based on file type
 */
export function getRecommendedMaxDimension(fileType: string): number {
  if (fileType === "thumbnail") {
    return 800 // Thumbnails don't need to be huge
  } else if (fileType === "photo") {
    return 1920 // Standard HD resolution
  } else {
    return 2560 // 2K resolution for important images
  }
}

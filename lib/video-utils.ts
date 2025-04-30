/**
 * Utility functions for video-related operations
 */

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
 * Upload a video to Vercel Blob storage
 */
export async function uploadVideo(
  formData: FormData,
): Promise<{ success: boolean; message: string; url?: string; size?: number; contentType?: string; id?: string }> {
  // This is a placeholder function. In a real implementation,
  // this would upload the video to Vercel Blob storage.
  console.log("Simulating video upload with form data:", formData)
  return {
    success: true,
    message: "Video uploaded successfully (simulated)",
    url: "https://example.com/mock-video.mp4",
    size: 1024 * 1024, // 1MB
    contentType: "video/mp4",
    id: "mock-video-id",
  }
}

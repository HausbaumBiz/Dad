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

/**
 * Upload header image to Cloudflare with positioning data
 *
 * @param imageData The image data (base64 or blob)
 * @param businessId The business ID
 * @param viewWindowPosition The position of the view window
 * @param originalImageDimensions The original image dimensions
 * @returns Upload result with image ID
 */
export async function uploadHeaderImageToCloudflare(
  imageData: string | Blob,
  businessId: string,
  viewWindowPosition: { x: number; y: number },
  originalImageDimensions: { width: number; height: number },
): Promise<{ success: boolean; imageId?: string; error?: string }> {
  try {
    if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID) {
      console.error("Cloudflare credentials not configured")
      return { success: false, error: "Cloudflare credentials not configured" }
    }

    // Create FormData for the upload
    const formData = new FormData()

    // Handle base64 string input
    if (typeof imageData === "string" && imageData.includes("base64")) {
      try {
        // Convert base64 to blob
        const base64Response = await fetch(imageData)
        const blob = await base64Response.blob()

        // Check file size - Cloudflare has a 10MB limit
        if (blob.size > 10 * 1024 * 1024) {
          return { success: false, error: "Image exceeds 10MB size limit" }
        }

        formData.append("file", blob, `header-${businessId}-${Date.now()}.jpg`)
      } catch (error) {
        console.error("Error processing base64 image:", error)
        return { success: false, error: "Failed to process base64 image" }
      }
    }
    // Handle File or Blob input
    else if (imageData instanceof Blob || imageData instanceof File) {
      // Check file size - Cloudflare has a 10MB limit
      if (imageData.size > 10 * 1024 * 1024) {
        return { success: false, error: "Image exceeds 10MB size limit" }
      }

      formData.append("file", imageData, `header-${businessId}-${Date.now()}.jpg`)
    } else {
      return { success: false, error: "Invalid image data format" }
    }

    // Add metadata with positioning information
    const metadata = {
      businessId,
      type: "header-image",
      viewWindowPosition,
      originalImageDimensions,
      uploadedAt: new Date().toISOString(),
    }

    formData.append("metadata", JSON.stringify(metadata))

    console.log(`Uploading header image to Cloudflare for business: ${businessId}`)

    // Make the API request
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        },
        body: formData,
      },
    )

    // Check for HTTP errors
    if (!response.ok) {
      const statusCode = response.status
      let errorMessage = `HTTP error ${statusCode}`

      try {
        const errorText = await response.text()
        console.error(`Cloudflare upload error (${statusCode}):`, errorText)

        try {
          const errorJson = JSON.parse(errorText)
          if (errorJson.errors && errorJson.errors.length > 0) {
            errorMessage = `${errorMessage}: ${errorJson.errors[0].message}`
          } else if (errorJson.error) {
            errorMessage = `${errorMessage}: ${errorJson.error}`
          }
        } catch (parseError) {
          errorMessage = `${errorMessage}: ${errorText.substring(0, 100)}`
        }
      } catch (textError) {
        errorMessage = `${errorMessage}: Could not read error details`
      }

      return { success: false, error: errorMessage }
    }

    // Parse the successful response
    let result
    try {
      result = await response.json()
    } catch (error) {
      console.error("Error parsing Cloudflare response:", error)
      return { success: false, error: "Failed to parse Cloudflare response" }
    }

    // Check for API-level errors
    if (!result.success) {
      console.error("Cloudflare API error:", result.errors)
      return {
        success: false,
        error: result.errors?.[0]?.message || "Upload failed in Cloudflare API",
      }
    }

    console.log("Header image uploaded successfully to Cloudflare")
    return { success: true, imageId: result.result.id }
  } catch (error) {
    console.error("Error uploading header image to Cloudflare:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during upload",
    }
  }
}

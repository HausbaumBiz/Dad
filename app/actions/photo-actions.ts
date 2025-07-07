"use server"

import { kv } from "@/lib/redis"
import { getCloudflareImageUrl } from "@/lib/cloudflare-images-utils"

// Function to load business photos from Redis and generate Cloudflare URLs
export async function loadBusinessPhotos(businessId: string): Promise<string[]> {
  try {
    console.log(`Loading photos for business: ${businessId}`)

    const photos: string[] = []

    // Check photoAlbum field in main business data
    const businessData = await kv.get(`business:${businessId}`)
    if (businessData && typeof businessData === "object") {
      const business = businessData as any

      if (business.photoAlbum && Array.isArray(business.photoAlbum)) {
        console.log("Found photoAlbum array:", business.photoAlbum)
        business.photoAlbum.forEach((photo: any) => {
          if (typeof photo === "string") {
            // If it's already a URL, use it; otherwise generate Cloudflare URL
            if (photo.startsWith("http")) {
              photos.push(photo)
            } else {
              photos.push(getCloudflareImageUrl(photo, "public"))
            }
          } else if (photo && typeof photo === "object") {
            // Handle object format
            const imageId = photo.id || photo.imageId || photo.url
            if (imageId) {
              if (imageId.startsWith("http")) {
                photos.push(imageId)
              } else {
                photos.push(getCloudflareImageUrl(imageId, "public"))
              }
            }
          }
        })
      }
    }

    // Check media.photoAlbum field
    const mediaData = await kv.get(`business:${businessId}:media`)
    if (mediaData && typeof mediaData === "object") {
      const media = mediaData as any
      if (media.photoAlbum && Array.isArray(media.photoAlbum)) {
        console.log("Found media.photoAlbum array:", media.photoAlbum)
        media.photoAlbum.forEach((photo: any) => {
          if (typeof photo === "string") {
            if (photo.startsWith("http")) {
              photos.push(photo)
            } else {
              photos.push(getCloudflareImageUrl(photo, "public"))
            }
          } else if (photo && typeof photo === "object") {
            const imageId = photo.id || photo.imageId || photo.url
            if (imageId) {
              if (imageId.startsWith("http")) {
                photos.push(imageId)
              } else {
                photos.push(getCloudflareImageUrl(imageId, "public"))
              }
            }
          }
        })
      }
    }

    // Check adDesign.photoAlbum field
    const adDesignData = await kv.get(`business:${businessId}:adDesign`)
    if (adDesignData && typeof adDesignData === "object") {
      const adDesign = adDesignData as any
      if (adDesign.photoAlbum && Array.isArray(adDesign.photoAlbum)) {
        console.log("Found adDesign.photoAlbum array:", adDesign.photoAlbum)
        adDesign.photoAlbum.forEach((photo: any) => {
          if (typeof photo === "string") {
            if (photo.startsWith("http")) {
              photos.push(photo)
            } else {
              photos.push(getCloudflareImageUrl(photo, "public"))
            }
          } else if (photo && typeof photo === "object") {
            const imageId = photo.id || photo.imageId || photo.url
            if (imageId) {
              if (imageId.startsWith("http")) {
                photos.push(imageId)
              } else {
                photos.push(getCloudflareImageUrl(imageId, "public"))
              }
            }
          }
        })
      }
    }

    // Check for individual photo keys
    const photoKeys = [
      `business:${businessId}:photos`,
      `business:${businessId}:photoAlbum`,
      `business:${businessId}:images`,
    ]

    for (const key of photoKeys) {
      try {
        const photoData = await kv.get(key)
        if (photoData) {
          if (Array.isArray(photoData)) {
            photoData.forEach((photo: any) => {
              if (typeof photo === "string") {
                if (photo.startsWith("http")) {
                  photos.push(photo)
                } else {
                  photos.push(getCloudflareImageUrl(photo, "public"))
                }
              } else if (photo && typeof photo === "object") {
                const imageId = photo.id || photo.imageId || photo.url
                if (imageId) {
                  if (imageId.startsWith("http")) {
                    photos.push(imageId)
                  } else {
                    photos.push(getCloudflareImageUrl(imageId, "public"))
                  }
                }
              }
            })
          }
        }
      } catch (error) {
        console.log(`No data found for key: ${key}`)
      }
    }

    // Remove duplicates
    const uniquePhotos = [...new Set(photos)]

    console.log(`Total unique photos found for business ${businessId}:`, uniquePhotos.length)
    return uniquePhotos
  } catch (error) {
    console.error("Error loading business photos:", error)
    return []
  }
}

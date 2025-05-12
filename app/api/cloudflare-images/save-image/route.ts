import { NextResponse } from "next/server"
import { kv } from "@/lib/redis"
import { revalidatePath } from "next/cache"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { businessId, imageId, filename, contentType, size, originalSize } = data

    if (!businessId || !imageId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Use the correct Cloudflare account hash
    const accountId = "Fx83XHJ2QHIeAJio-AnNbA"

    // Construct the image URL with the correct account hash
    const imageUrl = `https://imagedelivery.net/${accountId}/${imageId}/public`

    console.log(`Created image URL: ${imageUrl} for image ID: ${imageId}`)

    // Create a media item
    const newPhoto = {
      id: imageId,
      url: imageUrl,
      filename: filename || `image-${Date.now()}.jpg`,
      contentType: contentType || "image/jpeg",
      size: size || 0,
      originalSize: originalSize || size || 0,
      createdAt: new Date().toISOString(),
    }

    // Get existing media data
    const mediaKey = `business:${businessId}:media`
    const mediaData = await kv.hgetall(mediaKey)

    // Initialize photo album array
    let photoAlbum = []

    // Safely parse existing photo album if it exists
    if (mediaData && mediaData.photoAlbum !== undefined && mediaData.photoAlbum !== null) {
      try {
        // Check the type of photoAlbum data
        if (typeof mediaData.photoAlbum === "string") {
          const photoAlbumStr = mediaData.photoAlbum
          // Check if the string is not empty
          if (photoAlbumStr && photoAlbumStr.trim() !== "") {
            photoAlbum = JSON.parse(photoAlbumStr)
          }
        } else if (Array.isArray(mediaData.photoAlbum)) {
          // If it's already an array, use it directly
          photoAlbum = mediaData.photoAlbum
        } else if (typeof mediaData.photoAlbum === "object" && mediaData.photoAlbum !== null) {
          // If it's an object, convert it to a string and parse it
          photoAlbum = JSON.parse(JSON.stringify(mediaData.photoAlbum))
        }

        // Ensure it's an array
        if (!Array.isArray(photoAlbum)) {
          console.warn("Photo album is not an array, resetting to empty array")
          photoAlbum = []
        }
      } catch (error) {
        console.error("Error parsing photo album:", error, "Type:", typeof mediaData.photoAlbum)
        // Continue with an empty array
        photoAlbum = []
      }
    }

    // Add the new photo to the album
    const updatedPhotoAlbum = [...photoAlbum, newPhoto]

    // Store in Redis
    await kv.hset(mediaKey, {
      photoAlbum: JSON.stringify(updatedPhotoAlbum),
    })

    // Revalidate the photo album page
    revalidatePath(`/photo-album`)

    return NextResponse.json({
      success: true,
      photo: newPhoto,
      photoAlbum: updatedPhotoAlbum,
    })
  } catch (error) {
    console.error("Error saving image information:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

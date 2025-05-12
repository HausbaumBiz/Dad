import { NextResponse } from "next/server"
import { kv } from "@/lib/redis"
import { fixCloudflareImageUrl } from "@/lib/cloudflare-images-utils"

export async function POST(request: Request) {
  try {
    const { businessId } = await request.json()

    if (!businessId) {
      return NextResponse.json({ success: false, error: "Missing businessId" }, { status: 400 })
    }

    // Get existing media data
    const mediaKey = `business:${businessId}:media`
    const mediaData = await kv.hgetall(mediaKey)

    if (!mediaData || !mediaData.photoAlbum) {
      return NextResponse.json({ success: false, error: "No photo album found" }, { status: 404 })
    }

    let photoAlbum = []
    let fixedCount = 0

    // Parse the photo album
    try {
      if (typeof mediaData.photoAlbum === "string") {
        photoAlbum = JSON.parse(mediaData.photoAlbum)
      } else if (Array.isArray(mediaData.photoAlbum)) {
        photoAlbum = mediaData.photoAlbum
      } else {
        photoAlbum = JSON.parse(JSON.stringify(mediaData.photoAlbum))
      }
    } catch (error) {
      return NextResponse.json({ success: false, error: "Failed to parse photo album" }, { status: 500 })
    }

    // Fix the URLs in the photo album
    const updatedPhotoAlbum = photoAlbum.map((photo) => {
      if (photo.url) {
        const originalUrl = photo.url
        const fixedUrl = fixCloudflareImageUrl(photo.url)

        if (originalUrl !== fixedUrl) {
          fixedCount++
          return { ...photo, url: fixedUrl }
        }
      }
      return photo
    })

    // Save the updated photo album
    await kv.hset(mediaKey, {
      photoAlbum: JSON.stringify(updatedPhotoAlbum),
    })

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} image URLs`,
      totalImages: photoAlbum.length,
    })
  } catch (error) {
    console.error("Error fixing image URLs:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

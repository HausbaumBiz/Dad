import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@/lib/redis"
import { revalidatePath } from "next/cache"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const businessId = formData.get("businessId") as string
    const action = formData.get("action") as string

    if (!businessId) {
      return NextResponse.json({ success: false, error: "Missing business ID" }, { status: 400 })
    }

    if (action === "updatePhotos") {
      const photosJson = formData.get("photos") as string

      if (!photosJson) {
        return NextResponse.json({ success: false, error: "Missing photos data" }, { status: 400 })
      }

      try {
        const photos = JSON.parse(photosJson)

        // Update the photos in Redis
        await kv.hset(`business:${businessId}:media`, {
          photoAlbum: JSON.stringify(photos),
        })

        // Revalidate the photo album page
        revalidatePath("/photo-album")

        return NextResponse.json({ success: true })
      } catch (error) {
        console.error("Error parsing photos JSON:", error)
        return NextResponse.json({ success: false, error: "Invalid photos data" }, { status: 400 })
      }
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error updating photos:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Revalidate the customize page to pick up new video data
    revalidatePath("/ad-design/customize")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error revalidating customize page:", error)
    return NextResponse.json({ success: false, error: "Failed to revalidate" }, { status: 500 })
  }
}

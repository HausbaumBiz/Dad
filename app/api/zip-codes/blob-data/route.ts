import { type NextRequest, NextResponse } from "next/server"
import { list } from "@vercel/blob"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // List blobs with the zip-codes prefix
    const { blobs } = await list({ prefix: "data/zip-codes/" })

    // Find the zip-data.json file
    const zipDataBlob = blobs.find((blob) => blob.pathname === "data/zip-codes/zip-data.json")

    if (!zipDataBlob) {
      return NextResponse.json({
        exists: false,
        message: "ZIP code data file not found in Blob Storage",
      })
    }

    return NextResponse.json({
      exists: true,
      url: zipDataBlob.url,
      size: zipDataBlob.size,
      uploadedAt: zipDataBlob.uploadedAt,
    })
  } catch (error) {
    console.error("Error checking Blob Storage:", error)
    return NextResponse.json(
      {
        error: "Failed to check Blob Storage",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

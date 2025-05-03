import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(request: NextRequest) {
  try {
    // Basic auth check (should be improved in production)
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse the form data
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Upload to Blob storage
    const blob = await put("data/zip-codes/zip-data.json", file, {
      access: "public",
      contentType: "application/json",
    })

    return NextResponse.json({
      url: blob.url,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
      message: "File uploaded successfully",
    })
  } catch (error) {
    console.error("Error uploading to Blob storage:", error)
    return NextResponse.json(
      {
        error: "Failed to upload file to Blob storage",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

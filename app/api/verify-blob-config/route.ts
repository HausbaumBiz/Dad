import { put, list } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check if we have a token
    const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN

    if (!hasToken) {
      return NextResponse.json({
        success: false,
        error: "BLOB_READ_WRITE_TOKEN is not set",
        hasToken: false,
        blobCount: 0,
      })
    }

    // Try to list blobs to verify access
    try {
      // Create a test path that's unique to this verification
      const testPath = `verify-blob-config-${Date.now()}.txt`

      // Try to put a small test blob
      await put(testPath, "Test content", {
        access: "public",
      })

      // List blobs to count them
      const { blobs } = await list()

      return NextResponse.json({
        success: true,
        hasToken: true,
        blobCount: blobs.length,
      })
    } catch (blobError) {
      console.error("Blob operation error:", blobError)
      return NextResponse.json({
        success: false,
        error: blobError instanceof Error ? blobError.message : "Unknown blob operation error",
        hasToken: true,
        blobCount: 0,
      })
    }
  } catch (error) {
    console.error("Verify blob config error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      hasToken: false,
      blobCount: 0,
    })
  }
}

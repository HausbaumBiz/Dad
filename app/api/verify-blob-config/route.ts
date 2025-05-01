import { NextResponse } from "next/server"
import { list } from "@vercel/blob"

export async function GET() {
  try {
    // Try to list blobs to verify the configuration
    const result = await list()

    return NextResponse.json({
      success: true,
      message: "Blob storage configuration is valid",
      blobCount: result.blobs.length,
      hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    })
  } catch (error) {
    console.error("Error verifying Blob storage configuration:", error)

    let errorMessage = "Unknown error"
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
        tokenLength: process.env.BLOB_READ_WRITE_TOKEN ? process.env.BLOB_READ_WRITE_TOKEN.length : 0,
      },
      { status: 500 },
    )
  }
}

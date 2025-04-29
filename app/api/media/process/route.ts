import { type NextRequest, NextResponse } from "next/server"
import sharp from "sharp"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const quality = Number(formData.get("quality") || 80)
    const maxWidth = Number(formData.get("maxWidth") || 1920)
    const maxHeight = Number(formData.get("maxHeight") || 1920)
    const format = (formData.get("format") || "webp") as "jpeg" | "png" | "webp" | "avif"

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Process with Sharp
    let sharpInstance = sharp(buffer).resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    })

    // Apply format-specific compression
    if (format === "jpeg") {
      sharpInstance = sharpInstance.jpeg({ quality })
    } else if (format === "png") {
      sharpInstance = sharpInstance.png({ quality: Math.min(Math.max(quality, 1), 100) })
    } else if (format === "webp") {
      sharpInstance = sharpInstance.webp({ quality })
    } else if (format === "avif") {
      sharpInstance = sharpInstance.avif({ quality })
    }

    // Get processed image and metadata
    const { data, info } = await sharpInstance.toBuffer({ resolveWithObject: true })

    // Convert buffer to base64 for response
    const base64 = data.toString("base64")

    return NextResponse.json({
      success: true,
      data: base64,
      contentType: `image/${format}`,
      info: {
        width: info.width,
        height: info.height,
        size: data.length,
        format: info.format,
      },
    })
  } catch (error) {
    console.error("Error processing image:", error)
    return NextResponse.json({ success: false, error: "Failed to process image" }, { status: 500 })
  }
}

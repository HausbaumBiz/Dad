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

    // Validate buffer
    if (!buffer || buffer.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid image data" }, { status: 400 })
    }

    // Log image details for debugging
    console.log(`Processing image: ${file.name}, size: ${buffer.length} bytes, format: ${format}, quality: ${quality}`)

    try {
      // Process with Sharp
      let sharpInstance = sharp(buffer)

      // Get image metadata first to validate it's a proper image
      const metadata = await sharpInstance.metadata()
      console.log(`Image metadata: ${JSON.stringify(metadata)}`)

      // Resize the image
      sharpInstance = sharpInstance.resize({
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
    } catch (sharpError) {
      console.error("Sharp processing error:", sharpError)

      // Return the original image if Sharp processing fails
      return NextResponse.json({
        success: true,
        data: buffer.toString("base64"),
        contentType: file.type,
        info: {
          width: 0, // Unknown dimensions
          height: 0,
          size: buffer.length,
          format: file.type.split("/")[1] || "unknown",
        },
        warning: "Image processing failed, returning original image",
      })
    }
  } catch (error) {
    console.error("Error processing image:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process image",
      },
      { status: 500 },
    )
  }
}

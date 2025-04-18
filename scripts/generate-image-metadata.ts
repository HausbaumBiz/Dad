/**
 * Script to generate image metadata for the project
 * Run with: npx ts-node scripts/generate-image-metadata.ts
 */

import fs from "fs"
import path from "path"
import sharp from "sharp"

// Configuration
const PUBLIC_DIR = path.join(process.cwd(), "public")
const OUTPUT_FILE = path.join(process.cwd(), "utils/image-metadata.json")

interface ImageMetadata {
  src: string
  width: number
  height: number
  format: string
  size: number
}

// Get all image files
function getImageFiles(dir: string, basePath = ""): string[] {
  const files = fs.readdirSync(dir)

  return files.reduce<string[]>((acc, file) => {
    const filePath = path.join(dir, file)
    const relativePath = path.join(basePath, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      // Skip the optimized directory
      if (file === "optimized") return acc
      return [...acc, ...getImageFiles(filePath, relativePath)]
    }

    // Check if it's an image
    const ext = path.extname(file).toLowerCase()
    if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(ext)) {
      return [...acc, relativePath]
    }

    return acc
  }, [])
}

// Process images
async function generateMetadata() {
  const imageFiles = getImageFiles(PUBLIC_DIR)
  console.log(`Found ${imageFiles.length} images`)

  const metadata: Record<string, ImageMetadata> = {}

  for (const file of imageFiles) {
    const fullPath = path.join(PUBLIC_DIR, file)

    try {
      const image = sharp(fullPath)
      const info = await image.metadata()
      const stats = fs.statSync(fullPath)

      metadata[`/${file.replace(/\\/g, "/")}`] = {
        src: `/${file.replace(/\\/g, "/")}`,
        width: info.width || 0,
        height: info.height || 0,
        format: info.format || "unknown",
        size: stats.size,
      }

      console.log(`Processed: ${file}`)
    } catch (err) {
      console.error(`Error processing ${file}:`, err)
    }
  }

  // Write metadata to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(metadata, null, 2))

  console.log(`Metadata written to ${OUTPUT_FILE}`)
}

// Run the script
generateMetadata()
  .then(() => console.log("Image metadata generation complete!"))
  .catch((err) => console.error("Error generating metadata:", err))

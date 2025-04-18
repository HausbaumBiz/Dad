/**
 * Script to pre-optimize images before deployment
 * Run with: npx ts-node scripts/optimize-images.ts
 */

import fs from "fs"
import path from "path"
import sharp from "sharp"

// Configuration
const PUBLIC_DIR = path.join(process.cwd(), "public")
const OUTPUT_DIR = path.join(process.cwd(), "public/optimized")
const SIZES = [
  { width: 640, suffix: "sm" },
  { width: 1024, suffix: "md" },
  { width: 1920, suffix: "lg" },
]
const QUALITY = 80
const FORMATS = ["webp", "avif"] // Modern formats

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

// Get all image files
function getImageFiles(dir: string): string[] {
  const files = fs.readdirSync(dir)

  return files.reduce<string[]>((acc, file) => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      // Skip the optimized directory to avoid reprocessing
      if (file === "optimized") return acc
      return [...acc, ...getImageFiles(filePath)]
    }

    // Check if it's an image
    const ext = path.extname(file).toLowerCase()
    if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
      return [...acc, filePath]
    }

    return acc
  }, [])
}

// Process images
async function optimizeImages() {
  const imageFiles = getImageFiles(PUBLIC_DIR)
  console.log(`Found ${imageFiles.length} images to optimize`)

  for (const file of imageFiles) {
    const relativePath = path.relative(PUBLIC_DIR, file)
    const filename = path.basename(file, path.extname(file))
    const outputDir = path.join(OUTPUT_DIR, path.dirname(relativePath))

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Load image
    const image = sharp(file)
    const metadata = await image.metadata()

    // Generate different sizes
    for (const size of SIZES) {
      // Skip if original is smaller than target size
      if (metadata.width && metadata.width < size.width) continue

      const resized = image.resize(size.width)

      // Generate different formats
      for (const format of FORMATS) {
        const outputPath = path.join(outputDir, `${filename}-${size.suffix}.${format}`)

        await resized[format]({ quality: QUALITY }).toFile(outputPath)
        console.log(`Generated: ${outputPath}`)
      }
    }

    // Also create a tiny placeholder for blur-up effect
    const placeholderPath = path.join(outputDir, `${filename}-placeholder.webp`)
    await image.resize(20).webp({ quality: 20 }).toFile(placeholderPath)

    console.log(`Generated placeholder: ${placeholderPath}`)
  }
}

// Run the optimization
optimizeImages()
  .then(() => console.log("Image optimization complete!"))
  .catch((err) => console.error("Error optimizing images:", err))

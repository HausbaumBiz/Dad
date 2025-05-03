import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Define the path to the ZIP code data file
    const dataDir = path.join(process.cwd(), "data", "zip-codes")
    const filePath = path.join(dataDir, "zip-data.json")

    try {
      // Check if the directory exists
      try {
        await fs.access(dataDir)
      } catch (dirError) {
        // Directory doesn't exist
        return NextResponse.json({
          exists: false,
          path: dataDir,
          error: `Directory does not exist: ${dirError instanceof Error ? dirError.message : String(dirError)}`,
        })
      }

      // Check if the file exists
      const stats = await fs.stat(filePath)

      // If we get here, the file exists
      let recordCount
      try {
        // Try to read the file and count records
        const fileContent = await fs.readFile(filePath, "utf-8")
        const data = JSON.parse(fileContent)
        recordCount = Object.keys(data).length
      } catch (readError) {
        // Couldn't read or parse the file
        console.error("Error reading ZIP code file:", readError)
      }

      return NextResponse.json({
        exists: true,
        path: filePath,
        size: stats.size,
        lastModified: stats.mtime.toISOString(),
        recordCount,
      })
    } catch (error) {
      // File doesn't exist
      return NextResponse.json({
        exists: false,
        path: filePath,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  } catch (error) {
    console.error("Error checking ZIP code file:", error)
    return NextResponse.json(
      {
        error: "Failed to check ZIP code file",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

import { NextResponse } from "next/server"
import { parse } from "csv-parse/sync"
import { kv } from "@/lib/redis"
import { generateId } from "@/lib/utils"
import {
  saveBusinessToDb,
  saveBusinessCategories as saveStandardizedCategories,
  saveBusinessServiceArea,
  KEY_PREFIXES,
  type CategoryData,
} from "@/lib/db-schema"
import type { Business } from "@/lib/definitions"
import { put } from "@vercel/blob"
import { revalidatePath } from "next/cache"
import { getCategoryNameForPagePath } from "@/lib/category-mapping"

type ParsedRow = {
  "Business Name": string
  "Phone Number": string
  "Business Address": string
  "Zip Code": string
  Website?: string
  Email?: string
}

function normalizeHeader(h: string) {
  return h.trim()
}

function normalizePagePath(raw: string) {
  const s = String(raw || "").trim()
  if (!s) return ""
  return s.startsWith("/") ? s : `/${s}`
}

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const rawCategoryPath = String(form.get("categoryPath") || "").trim()
    const categoryPath = normalizePagePath(rawCategoryPath)
    const csvFile = form.get("csv") as File | null
    const videoFile = form.get("video") as File | null

    if (!categoryPath) {
      return NextResponse.json(
        { message: "Missing categoryPath", errors: [{ row: 0, error: "Missing categoryPath" }] },
        { status: 400 },
      )
    }
    if (!csvFile) {
      return NextResponse.json(
        { message: "Missing CSV upload", errors: [{ row: 0, error: "Missing CSV upload" }] },
        { status: 400 },
      )
    }

    // Determine the canonical category name used for indexing on category pages
    const categoryName = getCategoryNameForPagePath(categoryPath) || categoryPath.replace(/^\//, "")

    // Optional default video upload for placeholders
    let defaultVideoUrl: string | null = null
    if (videoFile && videoFile.size > 0) {
      try {
        const arrayBuffer = await videoFile.arrayBuffer()
        const pathname = `placeholder-videos/${Date.now()}-${videoFile.name}`
        const uploaded = await put(pathname, new Blob([arrayBuffer], { type: videoFile.type }), {
          access: "public",
          token: process.env.BLOB_READ_WRITE_TOKEN,
          contentType: videoFile.type || "application/octet-stream",
        })
        defaultVideoUrl = uploaded.url
        await kv.set("placeholderBusinesses:defaultVideoUrl", defaultVideoUrl)
      } catch (err) {
        // Non-fatal: proceed without video
        console.error("Video upload failed:", err)
      }
    }

    const csvText = await csvFile.text()
    const records = parse(csvText, {
      columns: (headers: string[]) => headers.map((h) => normalizeHeader(h)),
      skip_empty_lines: true,
      trim: true,
    }) as ParsedRow[]

    const required = ["Business Name", "Phone Number", "Business Address", "Zip Code"]
    const results: any[] = []
    const errors: any[] = []

    for (let i = 0; i < records.length; i++) {
      const rowNumber = i + 2 // +2 to account for 1-based + header row
      const r = records[i]

      // Validate required fields
      const missing = required.filter((k) => !(r as any)[k] || String((r as any)[k]).trim().length === 0)
      if (missing.length > 0) {
        errors.push({
          row: rowNumber,
          error: `Missing required field(s): ${missing.join(", ")}`,
        })
        continue
      }

      const businessName = String(r["Business Name"]).trim()
      const phone = String(r["Phone Number"]).trim()
      const address = String(r["Business Address"]).trim()
      const zip = String(r["Zip Code"]).trim()
      const website = r["Website"] ? String(r["Website"]).trim() : ""
      const email = r["Email"] ? String(r["Email"]).trim().toLowerCase() : ""

      try {
        const id = generateId()
        const now = new Date().toISOString()

        // Minimal placeholder business object
        const business: Business = {
          id,
          firstName: "",
          lastName: "",
          businessName,
          zipCode: zip,
          email: email || "",
          isEmailVerified: true,
          status: "active",
          createdAt: now,
          updatedAt: now,
          phone,
          address,
          category: categoryPath, // keep raw page path in category for traceability
          // mark placeholder (persisted; consumers treat this as boolean)
          isPlaceholder: true as any,
        }

        // Persist core business and enroll in global set
        await saveBusinessToDb(business)
        await kv.sadd(KEY_PREFIXES.BUSINESSES_SET, id)

        // Save standardized category objects (path-based) for compatibility
        const categoryData: CategoryData = {
          id: categoryPath, // use the page path verbatim as id
          name: categoryPath,
          path: categoryPath,
        }
        await saveStandardizedCategories(id, [categoryData])

        // Save service area (zip) and index by zip
        await saveBusinessServiceArea(id, {
          zipCodes: [zip],
          isNationwide: false,
        })

        // Save helpful extras
        if (website) {
          await kv.set(`${KEY_PREFIXES.BUSINESS}${id}:website`, website)
        }
        if (defaultVideoUrl) {
          await kv.set(`${KEY_PREFIXES.BUSINESS}${id}:videoUrl`, defaultVideoUrl)
        }

        // Path-based index (kept for diagnostics/back-compat)
        await kv.sadd(`${KEY_PREFIXES.CATEGORY}path:${categoryPath}`, id)

        // CRITICAL: Index using the categoryName that category pages read
        // 1) Persist "selectedCategories" for the business
        await kv.set(`${KEY_PREFIXES.BUSINESS}${id}:selectedCategories`, JSON.stringify([categoryName]))
        // 2) Add to CATEGORY:<Category Name>:businesses for fast lookup on category pages
        await kv.sadd(`${KEY_PREFIXES.CATEGORY}${categoryName}:businesses`, id)

        // Make placeholder match all subcategories under its main category
        await kv.sadd(`${KEY_PREFIXES.BUSINESS}${id}:placeholderCategories`, categoryName)

        results.push({
          row: rowNumber,
          id,
          businessName,
          zipCode: zip,
          categoryPath,
          categoryName,
          isPlaceholder: true,
          status: "active",
        })
      } catch (err: any) {
        console.error("Error creating placeholder business row", rowNumber, err)
        errors.push({
          row: rowNumber,
          error: err?.message ? String(err.message) : "Failed to create placeholder business",
        })
      }
    }

    // Revalidate the chosen category page so placeholders appear immediately
    try {
      revalidatePath(categoryPath)
      // Also revalidate the backing API route used by some pages (path segment form)
      const apiPath = `/api/businesses/by-category-page/${categoryPath.replace(/^\//, "")}`
      revalidatePath(apiPath)
    } catch (e) {
      console.warn("revalidatePath failed:", (e as Error).message)
    }

    const summaryMsg =
      results.length > 0
        ? `Created ${results.length} placeholder business(es). ${errors.length > 0 ? `(${errors.length} error(s))` : ""}`
        : `No placeholders created. ${errors.length > 0 ? `(${errors.length} error(s))` : ""}`

    return NextResponse.json(
      {
        success: true,
        message: summaryMsg,
        results,
        errors,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error handling placeholder CSV upload:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error creating placeholder businesses",
        errors: [{ row: 0, error: error?.message || "Unknown error" }],
      },
      { status: 500 },
    )
  }
}

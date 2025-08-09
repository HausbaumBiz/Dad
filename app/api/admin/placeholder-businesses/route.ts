import { type NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { kv } from "@vercel/kv"

type IncomingRow = Record<string, string | number | null | undefined>

type NewBizInput = {
  businessName: string
  phone?: string
  zipCode: string
  categoryPath: string // e.g. "/retail-stores"
}

type PlaceholderBusiness = {
  id: string
  firstName: string
  lastName: string
  businessName: string
  displayName?: string
  zipCode: string
  email: string
  passwordHash: string
  isEmailVerified: boolean
  status: "active" | "inactive"
  createdAt: string
  updatedAt: string
  phone?: string
  address?: string
  category?: string // page path e.g., "/retail-stores"
  isPlaceholder: boolean
  selectedCategories?: string[] // e.g. ["Retail Stores"]
}

/**
 * Convert "/retail-stores" -> "Retail Stores"
 * "/home-improvement/pool-services" -> "Home Improvement / Pool Services"
 */
function categoryNameFromPath(path: string): string {
  const safe = (path || "").trim().replace(/\/+/g, "/").replace(/\/$/, "")
  const segs = safe.split("/").filter(Boolean)
  if (segs.length === 0) return "General"

  const title = (slug: string) =>
    slug
      .split("-")
      .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
      .join(" ")

  return segs.map(title).join(" / ")
}

function normalizePhone(input?: string | null): string | undefined {
  if (!input) return undefined
  const digits = String(input).replace(/\D/g, "")
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return input || undefined
}

// Keys used for indexing. Using KV (Upstash/Vercel KV).
const businessKey = (id: string) => `business:${id}`
const idxCategoryPathKey = (categoryPath: string) => `idx:category-path:${categoryPath}:businesses`
const idxCategoryNameKey = (categoryName: string) => `idx:CATEGORY:${categoryName}:businesses`
const idxZipKey = (zip: string) => `idx:zip:${zip}:businesses`
const businessesAllKey = "idx:businesses:all"

/**
 * Save business and index it by:
 * - Category path (page)
 * - Category human-readable name
 * - Zip code
 * Also save selectedCategories = [Human Name] for consumers that rely on it.
 */
async function saveAndIndexPlaceholder(input: NewBizInput) {
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const categoryName = categoryNameFromPath(input.categoryPath)
  const phone = normalizePhone(input.phone)

  const biz: PlaceholderBusiness = {
    id,
    firstName: "",
    lastName: "",
    businessName: input.businessName,
    displayName: input.businessName,
    zipCode: input.zipCode,
    email: `placeholder-${id}@example.invalid`,
    passwordHash: "",
    isEmailVerified: true,
    status: "active",
    createdAt: now,
    updatedAt: now,
    phone,
    address: "",
    category: input.categoryPath,
    isPlaceholder: true,
    selectedCategories: [categoryName],
  }

  // Persist the business
  await kv.set(businessKey(id), biz)

  // Indexes
  await Promise.all([
    kv.sadd(idxCategoryPathKey(input.categoryPath), id),
    kv.sadd(idxCategoryNameKey(categoryName), id),
    kv.sadd(idxZipKey(input.zipCode), id),
    kv.sadd(businessesAllKey, id),
  ])

  return { id, categoryName }
}

async function parseCsvFile(file: File): Promise<IncomingRow[]> {
  const text = await file.text()
  // Lightweight CSV parsing without external deps. Supports simple CSV with header row.
  // For quotes/commas in fields, consider switching to 'papaparse'.
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length === 0) return []

  const headers = lines[0].split(",").map((h) => h.trim())
  const rows: IncomingRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim())
    const row: IncomingRow = {}
    headers.forEach((h, idx) => {
      row[h] = values[idx]
    })
    rows.push(row)
  }
  return rows
}

function getCell(row: IncomingRow, candidates: string[]): string | undefined {
  for (const key of candidates) {
    const val = row[key]
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      return String(val).trim()
    }
  }
  return undefined
}

/**
 * Accepts:
 * - multipart/form-data with fields:
 *   - file: CSV file with columns (flexible): businessName|name, phone|phone1|phoneNumber, zip|zipCode|Zip Code
 *   - categoryPath: e.g., "/retail-stores"
 * OR
 * - application/json with an array of items: [{ businessName, phone, zipCode, categoryPath }]
 */
export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || ""

  try {
    let rows: NewBizInput[] = []

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData()
      const file = form.get("file")
      const categoryPath = String(form.get("categoryPath") || "").trim()
      if (!(file instanceof File)) {
        return NextResponse.json({ ok: false, error: "Missing CSV file" }, { status: 400 })
      }
      if (!categoryPath.startsWith("/")) {
        return NextResponse.json({ ok: false, error: "categoryPath must start with '/'" }, { status: 400 })
      }

      const parsed = await parseCsvFile(file)
      rows = parsed
        .map((r) => {
          const businessName = getCell(r, ["businessName", "Business Name", "name", "Name"]) || ""
          const phone = getCell(r, ["phone", "phone1", "phoneNumber", "Phone"])
          const zipCode = getCell(r, ["zipCode", "zip", "Zip Code", "zipcode", "ZIP"]) || ""
          return {
            businessName,
            phone,
            zipCode,
            categoryPath,
          } as NewBizInput
        })
        .filter((r) => r.businessName && r.zipCode)
    } else if (contentType.includes("application/json")) {
      const body = await req.json()
      if (Array.isArray(body)) {
        rows = body
          .map((r) => ({
            businessName: String(r.businessName || "").trim(),
            phone: r.phone ? String(r.phone).trim() : undefined,
            zipCode: String(r.zipCode || "").trim(),
            categoryPath: String(r.categoryPath || "").trim(),
          }))
          .filter((r) => r.businessName && r.zipCode && r.categoryPath.startsWith("/"))
      } else {
        return NextResponse.json({ ok: false, error: "JSON body must be an array" }, { status: 400 })
      }
    } else {
      return NextResponse.json({ ok: false, error: "Unsupported Content-Type" }, { status: 415 })
    }

    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: "No valid rows found in upload" }, { status: 400 })
    }

    const results: { id: string; categoryName: string }[] = []
    const touchedPaths = new Set<string>()

    for (const row of rows) {
      const { id, categoryName } = await saveAndIndexPlaceholder(row)
      results.push({ id, categoryName })
      touchedPaths.add(row.categoryPath)
    }

    // Revalidate the affected category pages so listings appear immediately.
    // Also revalidate the root in case lists are on the home page.
    for (const path of touchedPaths) {
      revalidatePath(path)
    }

    return NextResponse.json({
      ok: true,
      created: results.length,
      businessIds: results.map((r) => r.id),
      categories: Array.from(new Set(results.map((r) => r.categoryName))),
    })
  } catch (err: any) {
    console.error("CSV placeholder upload failed:", err)
    return NextResponse.json({ ok: false, error: err?.message || "Upload failed" }, { status: 500 })
  }
}

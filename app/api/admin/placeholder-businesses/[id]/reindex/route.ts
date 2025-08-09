import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"
import { getCategoryNameForPagePath } from "@/lib/category-mapping"

type AnyObj = Record<string, any>

function normalizePagePath(raw?: string): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id
  if (!id) {
    return NextResponse.json({ success: false, error: "Missing business id" }, { status: 400 })
  }

  try {
    // 1) Load business
    const key = `${KEY_PREFIXES.BUSINESS}${id}`
    const data = await kv.get(key)
    if (!data || typeof data !== "object") {
      return NextResponse.json({ success: false, error: `Business ${id} not found` }, { status: 404 })
    }
    const business = data as AnyObj

    // 2) Ensure it's in the global businesses set
    await kv.sadd(KEY_PREFIXES.BUSINESSES_SET, id)

    // 3) Work out the category indexing target
    // The uploaded CSV stored category like "/retail-stores".
    // We need the human-readable category name used by the page mapping, e.g. "Retail Stores".
    const pagePath = normalizePagePath(business.category) || "/retail-stores"
    const categoryName = getCategoryNameForPagePath(pagePath) || "Retail Stores"

    // Index under CATEGORY:<name>:businesses
    await kv.sadd(`${KEY_PREFIXES.CATEGORY}${categoryName}:businesses`, id)

    // Also persist a simple "selectedCategories" list for compatibility
    await kv.set(`${KEY_PREFIXES.BUSINESS}${id}:selectedCategories`, JSON.stringify([categoryName]))

    // 4) Service area: ensure the business is discoverable by zip
    const zip = (business.zipCode || "").toString()
    if (zip && /^\d{5}$/.test(zip)) {
      // JSON list of zip objects (preferred by our loaders)
      const jsonZip = [{ zip, city: business.city || "", state: business.state || "", latitude: 0, longitude: 0 }]
      await kv.set(`${KEY_PREFIXES.BUSINESS}${id}:zipcodes`, JSON.stringify(jsonZip))
      // Also a set for compatibility/fallbacks
      await kv.del(`${KEY_PREFIXES.BUSINESS}${id}:zipcodes:set`)
      await kv.sadd(`${KEY_PREFIXES.BUSINESS}${id}:zipcodes:set`, zip)
      // Not nationwide
      await kv.set(`${KEY_PREFIXES.BUSINESS}${id}:nationwide`, false)
      // Add to zip index
      await kv.sadd(`${KEY_PREFIXES.ZIPCODE}${zip}:businesses`, id)
    }

    // 5) Mark as placeholder (helps hide photo carousels, etc.)
    await kv.set(`${KEY_PREFIXES.BUSINESS}${id}:isPlaceholder`, true)
    // Optionally mark placeholder category for "match all subcategories under this main category"
    await kv.sadd(`${KEY_PREFIXES.BUSINESS}${id}:placeholderCategories`, categoryName)

    // 6) Revalidate the page and backing API
    // Page path and API route path
    const pageToRevalidate = pagePath // e.g. "/retail-stores"
    revalidatePath(pageToRevalidate)
    revalidatePath(`/api/businesses/by-category-page/${pagePath.replace(/^\//, "")}`)

    return NextResponse.json({
      success: true,
      id,
      indexed: {
        categoryName,
        pagePath,
        zip,
      },
      message: `Reindexed placeholder business ${id} for ${categoryName} (${pagePath})`,
    })
  } catch (error: any) {
    console.error("Reindex error:", error)
    return NextResponse.json({ success: false, error: error?.message || "Unknown error" }, { status: 500 })
  }
}

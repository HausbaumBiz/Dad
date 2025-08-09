import { NextResponse } from "next/server"
import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"
import { getBusinessesForCategoryPage } from "@/lib/business-category-service"
import type { Business } from "@/lib/definitions"

function isTruthy(v: any) {
  return v === true || v === "true" || v === 1 || v === "1" || (typeof v === "string" && v.toLowerCase() === "yes")
}

async function isBlockedOrDeleted(id: string) {
  // Deleted tombstone
  const deleted = await kv.get(`${KEY_PREFIXES.BUSINESS}${id}:deleted`).catch(() => null)
  if (isTruthy(deleted)) return true

  // Blocked set
  try {
    // Prefer sismember if available
    // @ts-ignore - some kv clients expose sismember
    if (typeof (kv as any).sismember === "function") {
      const blocked = await (kv as any).sismember("businesses:blocked", id)
      if (blocked) return true
    } else {
      const blockedMembers = await kv.smembers("businesses:blocked").catch(() => [])
      if (Array.isArray(blockedMembers) && blockedMembers.includes(id)) return true
    }
  } catch {
    // ignore
  }
  return false
}

export async function GET(req: Request, { params }: { params: { path?: string[] } }) {
  try {
    const url = new URL(req.url)
    const zip = url.searchParams.get("zip")?.trim() || ""
    const pathSegments = params.path && params.path.length > 0 ? params.path : []
    // Page path used by our category mapping function, e.g. "automotive-services"
    const pagePath = pathSegments.join("/")

    if (!pagePath) {
      return NextResponse.json({ success: false, error: "Missing category page path." }, { status: 400 })
    }

    // Fetch all businesses for this category page (already filters inactive in service)
    const businesses: Business[] = await getBusinessesForCategoryPage(pagePath)

    // Exclude deleted/blocked just in case
    const filtered: Business[] = []
    for (const b of businesses) {
      if (!b?.id) continue
      if (await isBlockedOrDeleted(b.id)) continue
      filtered.push(b)
    }

    // Optional zip filtering (server-side), in addition to your client filtering
    let finalList = filtered
    if (zip) {
      finalList = filtered.filter((b: any) => {
        const isNationwide = Boolean(b?.isNationwide)
        if (isNationwide) return true
        const serviceZips: string[] = Array.isArray(b?.serviceArea) ? b.serviceArea : []
        if (serviceZips.includes(zip)) return true
        // Fallback to registration zip
        if (typeof b?.zipCode === "string" && b.zipCode === zip) return true
        return false
      })
    }

    return NextResponse.json({
      success: true,
      businesses: finalList,
      count: finalList.length,
    })
  } catch (error: any) {
    console.error("[by-category-page] Error:", error?.message || error)
    return NextResponse.json({ success: false, error: error?.message || "Unknown error" }, { status: 500 })
  }
}

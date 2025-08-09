import { NextResponse } from "next/server"
import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const businessId = params.id
  if (!businessId) {
    return NextResponse.json({ success: false, error: "Missing business ID" }, { status: 400 })
  }

  try {
    // Set deletion tombstone and add to blocked set
    await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}:deleted`, true)
    await kv.sadd("businesses:blocked", businessId)

    // Remove from global businesses set (if present)
    await kv.srem(KEY_PREFIXES.BUSINESSES_SET, businessId).catch(() => {})

    // Remove from nationwide set (if present)
    await kv.srem("businesses:nationwide", businessId).catch(() => {})

    // Remove from category business sets
    try {
      const categorySets = (await kv.keys(`${KEY_PREFIXES.CATEGORY}*:businesses`)) || []
      for (const setKey of categorySets) {
        await kv.srem(setKey, businessId).catch(() => {})
      }
    } catch (e) {
      // ignore
    }

    // Remove from zip indexes
    try {
      const zipSets = (await kv.keys(`zipcode:*:businesses`)) || []
      for (const setKey of zipSets) {
        await kv.srem(setKey, businessId).catch(() => {})
      }
    } catch (e) {
      // ignore
    }

    // Do not delete the primary data here; the tombstone guarantees it won't surface.
    // If you want a full purge (including keys like adDesign, media, etc.), run the purge script.

    return NextResponse.json({ success: true, message: `Business ${businessId} marked deleted and blocked.` })
  } catch (error: any) {
    console.error("[admin:delete-business] Error:", error?.message || error)
    return NextResponse.json({ success: false, error: error?.message || "Failed to delete business" }, { status: 500 })
  }
}

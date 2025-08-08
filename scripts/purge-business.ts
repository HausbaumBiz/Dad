// Purge a business and all related Redis keys and index references.
//
// Usage:
//   node scripts/purge-business.ts 01K24VNVY9FVNWWPE3TSH85MVP
//   # or rely on default (Acme Plumbing) ID:
//
//   node scripts/purge-business.ts
//
// Notes:
// - Requires KV_REST_API_URL and KV_REST_API_TOKEN to be set (Upstash Redis).
// - This script focuses on Redis data. It does not delete external assets
//   (e.g., Cloudflare Images/Stream). If needed, run your media cleanup separately.

import { kv } from "../lib/redis"

type AnyObject = Record<string, any>

const TARGET_ID_DEFAULT = "01K24VNVY9FVNWWPE3TSH85MVP"

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0
}

function normalizeArray<T>(data: unknown): T[] {
  if (!data) return []
  if (Array.isArray(data)) return data as T[]
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? (parsed as T[]) : []
    } catch {
      // Could be a single value string (like job ID); coerce to array
      return [data as unknown as T]
    }
  }
  return []
}

function safeJsonParse<T = any>(data: unknown, fallback: T): T {
  try {
    if (typeof data === "string") {
      return JSON.parse(data) as T
    }
    if (typeof data === "object" && data !== null) {
      return data as T
    }
  } catch {}
  return fallback
}

async function sremIfMember(key: string, member: string) {
  try {
    await kv.srem(key, member)
    console.log(`SREM ${key} ${member}`)
  } catch (e) {
    console.warn(`SREM failed for ${key} ${member}:`, (e as Error).message)
  }
}

async function delKeys(keys: string[]) {
  // Filter empties and dedupe
  const unique = Array.from(new Set(keys.filter(Boolean)))
  if (unique.length === 0) return { deleted: 0 }

  try {
    const deleted = await kv.del(...(unique as [string, ...string[]]))
    console.log(`DEL ${unique.length} keys -> deleted=${deleted}`)
    return { deleted: Number(deleted) || 0 }
  } catch (e) {
    // Some clients throw on variadic delete; fall back one-by-one
    console.warn("Bulk DEL failed, falling back to single-key deletes:", (e as Error).message)
    let deleted = 0
    for (const k of unique) {
      try {
        const res = await kv.del(k)
        if (res) deleted++
      } catch (err) {
        console.warn(`DEL failed for ${k}:`, (err as Error).message)
      }
    }
    return { deleted }
  }
}

async function purgeBusiness(businessId: string) {
  if (!isNonEmptyString(businessId)) {
    throw new Error("Business ID is required.")
  }

  console.log("=== PURGE START ===")
  console.log(`Target Business ID: ${businessId}`)

  // 1) Fetch main business record
  const businessKey = `business:${businessId}`
  const rawBusiness = await kv.get(businessKey)
  const business = safeJsonParse<AnyObject>(rawBusiness, {})

  if (!rawBusiness) {
    console.warn(`Business key not found: ${businessKey} — proceeding with index cleanup nonetheless.`)
  } else {
    console.log(`Loaded business record: ${business.businessName || "(no name)"} (${business.email || "no email"})`)
  }

  // 2) Remove email index
  if (isNonEmptyString(business.email)) {
    const emailKey = `business:email:${String(business.email).toLowerCase()}`
    await delKeys([emailKey])
  }

  // 3) Remove from primary category index if present
  if (isNonEmptyString(business.category)) {
    await sremIfMember(`category:${business.category}`, businessId)
  }

  // 4) Remove from standardized categories and path indexes
  //    business:<id>:categories may hold objects with id, parentId, path, etc.
  try {
    const categoriesRaw = await kv.get(`business:${businessId}:categories`)
    const categories = normalizeArray<any>(categoriesRaw)

    for (const cat of categories) {
      // Accept string or object shapes
      const id = isNonEmptyString(cat)
        ? String(cat)
        : isNonEmptyString(cat?.id)
          ? String(cat.id)
          : isNonEmptyString(cat?.category)
            ? String(cat.category)
            : ""

      const parentId = isNonEmptyString(cat?.parentId) ? String(cat.parentId) : ""
      const path = isNonEmptyString(cat?.path)
        ? String(cat.path)
        : isNonEmptyString(cat?.fullPath)
          ? String(cat.fullPath)
          : ""

      if (id) {
        await sremIfMember(`category:${id}`, businessId)
      }
      if (parentId && id) {
        await sremIfMember(`category:${parentId}:${id}`, businessId)
      }
      if (path) {
        await sremIfMember(`category:path:${path}`, businessId)
      }
    }
  } catch (e) {
    console.warn("Category cleanup warning:", (e as Error).message)
  }

  // 5) Service area cleanup: zip code indexes and nationwide set
  //    We support multiple storage shapes
  try {
    // Nationwide flag might be boolean or string-ish
    const nationwide = await kv.get(`business:${businessId}:nationwide`)
    const isNationwide =
      nationwide === true ||
      nationwide === "true" ||
      nationwide === 1 ||
      nationwide === "1" ||
      (typeof nationwide === "string" && nationwide.toLowerCase() === "yes")

    if (isNationwide) {
      await sremIfMember("businesses:nationwide", businessId)
    }

    // ZIPs set or JSON
    let zips: string[] = []
    try {
      zips = await kv.smembers(`business:${businessId}:zipcodes`)
    } catch {
      const zipRaw = await kv.get(`business:${businessId}:zipcodes`)
      zips = normalizeArray<string>(zipRaw)
    }

    for (const zip of zips) {
      if (isNonEmptyString(zip)) {
        await sremIfMember(`zipcode:${zip}:businesses`, businessId)
      }
    }
  } catch (e) {
    console.warn("Service area cleanup warning:", (e as Error).message)
  }

  // 6) Jobs cleanup: remove job documents and indexes (zip and category)
  try {
    const jobsIndexKey = `jobs:${businessId}`
    const rawJobsList = await kv.get(jobsIndexKey)
    const jobIds = normalizeArray<string>(rawJobsList)
    console.log(`Jobs found for business: ${jobIds.length}`)

    for (const jobId of jobIds) {
      const base = `job:${businessId}:${jobId}`
      const jobRaw = await kv.get(base)
      const job = safeJsonParse<AnyObject>(jobRaw, {})

      // Remove job from nationwide or zip indexes
      const ref = `${businessId}:${jobId}`

      // Service area
      const serviceAreaRaw = (await kv.get(`${base}:servicearea`)) ?? job?.serviceArea ?? null
      const serviceArea = safeJsonParse<any>(serviceAreaRaw, null)

      if (serviceArea && serviceArea.isNationwide) {
        await sremIfMember("jobs:nationwide", ref)
      } else if (serviceArea && Array.isArray(serviceArea.zipCodes)) {
        for (const z of serviceArea.zipCodes) {
          const zip = typeof z === "string" ? z : z?.zip
          if (isNonEmptyString(zip)) {
            await sremIfMember(`zipcode:${zip}:jobs`, ref)
          }
        }
      }

      // Category indexes
      const jobCatsRaw = (await kv.get(`${base}:categories`)) ?? job?.categories ?? null
      const jobCats = normalizeArray<string>(jobCatsRaw)

      for (const cat of jobCats) {
        const key = (cat || "").toLowerCase().trim().replace(/\s+/g, "-")
        if (isNonEmptyString(key)) {
          await sremIfMember(`category:${key}:jobs`, ref)
        }
      }

      // Delete job keys
      const jobKeys = [
        base,
        `${base}:categories`,
        `${base}:zipcodes`,
        `${base}:servicearea`,
      ]
      await delKeys(jobKeys)
    }

    // Delete jobs index list
    await delKeys([jobsIndexKey])
  } catch (e) {
    console.warn("Jobs cleanup warning:", (e as Error).message)
  }

  // 7) Coupons
  await delKeys([`business:${businessId}:coupons`])

  // 8) Analytics keys
  try {
    const analyticsKeys = (await kv.keys(`analytics:${businessId}:*`)) || []
    if (analyticsKeys.length > 0) {
      await delKeys(analyticsKeys)
    }
  } catch (e) {
    console.warn("Analytics cleanup warning:", (e as Error).message)
  }

  // 9) Delete all business:<id>:* auxiliary keys (media, adDesign, headerImage, settings, etc.)
  //    This catches: business:<id>:media, :adDesign, :adDesign:*, :serviceArea, :zipcodes, etc.
  try {
    const auxKeys = (await kv.keys(`business:${businessId}:*`)) || []
    if (auxKeys.length > 0) {
      await delKeys(auxKeys)
    }
  } catch (e) {
    console.warn("Auxiliary keys cleanup warning:", (e as Error).message)
  }

  // 10) Remove from global businesses set
  await sremIfMember("businesses", businessId)

  // 11) Finally, delete main business record
  await delKeys([businessKey])

  console.log("=== PURGE COMPLETE ===")
}

async function main() {
  const businessId = process.argv[2] || TARGET_ID_DEFAULT

  console.log("Upstash URL configured:", Boolean(process.env.KV_REST_API_URL))
  console.log("Upstash Token configured:", Boolean(process.env.KV_REST_API_TOKEN))
  console.log("")

  try {
    await purgeBusiness(businessId)
  } catch (e) {
    console.error("Purge failed:", (e as Error).message)
    process.exitCode = 1
  }
}

main()

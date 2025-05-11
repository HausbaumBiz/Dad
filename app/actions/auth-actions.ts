"use server"

import { cookies } from "next/headers"
import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"
import type { Business } from "@/lib/definitions"

// Check if a business is logged in
export async function getCurrentBusiness(): Promise<Business | null> {
  try {
    const businessId = cookies().get("businessId")?.value
    if (!businessId) {
      return null
    }

    const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)

    if (!business) {
      return null
    }

    return { ...(business as Business), id: businessId }
  } catch (error) {
    console.error("Error getting current business:", error)
    return null
  }
}

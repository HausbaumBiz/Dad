"use server"

import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"

// Function to check if a business is mapped to a specific page
export async function checkBusinessPageMapping(businessId: string, page: string): Promise<boolean> {
  try {
    const isMember = await kv.sismember(`page:${page}:businesses`, businessId)
    return isMember === 1
  } catch (error) {
    console.error(`Error checking if business ${businessId} is mapped to page ${page}:`, error)
    return false
  }
}

// Function to get all pages a business is mapped to
export async function getBusinessPageMappings(businessId: string): Promise<string[]> {
  try {
    // Get the business's page mappings
    const pageMappingsData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:pages`)

    if (!pageMappingsData) {
      return []
    }

    let pageMap: Record<string, boolean> = {}

    if (typeof pageMappingsData === "string") {
      try {
        pageMap = JSON.parse(pageMappingsData)
      } catch (error) {
        console.error(`Error parsing page mappings for business ${businessId}:`, error)
        return []
      }
    } else if (typeof pageMappingsData === "object" && pageMappingsData !== null) {
      pageMap = pageMappingsData as Record<string, boolean>
    }

    return Object.keys(pageMap)
  } catch (error) {
    console.error(`Error getting page mappings for business ${businessId}:`, error)
    return []
  }
}

// Function to verify if a business is actually in the page's business set
export async function verifyBusinessInPageSet(businessId: string, page: string): Promise<boolean> {
  try {
    const isMember = await kv.sismember(`page:${page}:businesses`, businessId)
    return isMember === 1
  } catch (error) {
    console.error(`Error verifying business ${businessId} in page ${page} set:`, error)
    return false
  }
}

// Function to get all businesses mapped to a specific page
export async function getBusinessesForPage(page: string): Promise<string[]> {
  try {
    return await kv.smembers(`page:${page}:businesses`)
  } catch (error) {
    console.error(`Error getting businesses for page ${page}:`, error)
    return []
  }
}

// Function to manually add a business to a page
export async function addBusinessToPage(businessId: string, page: string): Promise<boolean> {
  try {
    // Add to the page set
    await kv.sadd(`page:${page}:businesses`, businessId)

    // Update the business's page mappings
    const pageMappingsData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:pages`)
    let pageMap: Record<string, boolean> = {}

    if (pageMappingsData) {
      if (typeof pageMappingsData === "string") {
        try {
          pageMap = JSON.parse(pageMappingsData)
        } catch (error) {
          console.error(`Error parsing page mappings for business ${businessId}:`, error)
        }
      } else if (typeof pageMappingsData === "object" && pageMappingsData !== null) {
        pageMap = pageMappingsData as Record<string, boolean>
      }
    }

    pageMap[page] = true
    await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}:pages`, JSON.stringify(pageMap))

    return true
  } catch (error) {
    console.error(`Error adding business ${businessId} to page ${page}:`, error)
    return false
  }
}

// Function to manually remove a business from a page
export async function removeBusinessFromPage(businessId: string, page: string): Promise<boolean> {
  try {
    // Remove from the page set
    await kv.srem(`page:${page}:businesses`, businessId)

    // Update the business's page mappings
    const pageMappingsData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:pages`)
    let pageMap: Record<string, boolean> = {}

    if (pageMappingsData) {
      if (typeof pageMappingsData === "string") {
        try {
          pageMap = JSON.parse(pageMappingsData)
        } catch (error) {
          console.error(`Error parsing page mappings for business ${businessId}:`, error)
        }
      } else if (typeof pageMappingsData === "object" && pageMappingsData !== null) {
        pageMap = pageMappingsData as Record<string, boolean>
      }
    }

    delete pageMap[page]
    await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}:pages`, JSON.stringify(pageMap))

    return true
  } catch (error) {
    console.error(`Error removing business ${businessId} from page ${page}:`, error)
    return false
  }
}

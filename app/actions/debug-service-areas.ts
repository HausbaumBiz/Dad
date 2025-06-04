"use server"

import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"

export async function debugServiceAreas() {
  try {
    console.log("=== DEBUG: Service Areas ===")

    // Get all business keys
    const businessKeys = await kv.keys(`${KEY_PREFIXES.BUSINESS}*`)
    const businessIds = businessKeys
      .filter((key) => !key.includes(":"))
      .map((key) => key.replace(KEY_PREFIXES.BUSINESS, ""))

    console.log(`Found ${businessIds.length} businesses`)

    for (const businessId of businessIds) {
      try {
        // Get business basic info
        const businessData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)
        const businessName = businessData?.businessName || "Unknown"

        // Check service area
        const serviceAreaKey = `${KEY_PREFIXES.BUSINESS}${businessId}:serviceArea`
        const serviceArea = await kv.get(serviceAreaKey)

        console.log(`\n--- Business: ${businessName} (${businessId}) ---`)
        console.log(`Business ZIP: ${businessData?.zipCode}`)

        if (serviceArea) {
          const parsedServiceArea = typeof serviceArea === "string" ? JSON.parse(serviceArea) : serviceArea
          console.log(`Service Area:`, parsedServiceArea)

          if (parsedServiceArea.zipCodes && Array.isArray(parsedServiceArea.zipCodes)) {
            const zipCodes = parsedServiceArea.zipCodes.map((z) => z.zip || z).slice(0, 10)
            console.log(
              `Services ZIP codes: ${zipCodes.join(", ")}${parsedServiceArea.zipCodes.length > 10 ? "..." : ""}`,
            )

            // Check if it services 44718
            const services44718 = parsedServiceArea.zipCodes.some((z) => (z.zip || z) === "44718")
            const services44720 = parsedServiceArea.zipCodes.some((z) => (z.zip || z) === "44720")
            console.log(`Services 44718: ${services44718}`)
            console.log(`Services 44720: ${services44720}`)
          }
        } else {
          console.log(`No service area set`)
        }

        // Check categories
        const categoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:categories`)
        if (categoriesData) {
          const categories = typeof categoriesData === "string" ? JSON.parse(categoriesData) : categoriesData
          const homeCategories = categories.filter(
            (cat) => cat.fullPath && cat.fullPath.includes("Home, Lawn, and Manual Labor"),
          )
          if (homeCategories.length > 0) {
            console.log(`Home categories: ${homeCategories.map((c) => c.fullPath).join(", ")}`)
          }
        }
      } catch (error) {
        console.error(`Error checking business ${businessId}:`, error)
      }
    }

    return { success: true, message: "Debug complete - check console" }
  } catch (error) {
    console.error("Debug error:", error)
    return { success: false, error: error.message }
  }
}

export async function expandServiceAreaForBusiness(businessId: string, targetZipCode: string) {
  try {
    console.log(`Expanding service area for business ${businessId} to include ${targetZipCode}`)

    // Get current service area
    const serviceAreaKey = `${KEY_PREFIXES.BUSINESS}${businessId}:serviceArea`
    const currentServiceArea = await kv.get(serviceAreaKey)

    const serviceArea = currentServiceArea
      ? typeof currentServiceArea === "string"
        ? JSON.parse(currentServiceArea)
        : currentServiceArea
      : { zipCodes: [] }

    // Ensure zipCodes array exists
    if (!serviceArea.zipCodes) {
      serviceArea.zipCodes = []
    }

    // Check if zip code already exists
    const existingZip = serviceArea.zipCodes.find((z) => (z.zip || z) === targetZipCode)

    if (!existingZip) {
      // Add the new zip code
      serviceArea.zipCodes.push({
        zip: targetZipCode,
        city: "Test City",
        state: "OH",
        distance: 5, // 5 miles from business
      })

      // Save updated service area
      await kv.set(serviceAreaKey, JSON.stringify(serviceArea))

      console.log(`✅ Added ${targetZipCode} to service area for business ${businessId}`)
      return { success: true, message: `Added ${targetZipCode} to service area` }
    } else {
      console.log(`ZIP code ${targetZipCode} already in service area`)
      return { success: true, message: `ZIP code ${targetZipCode} already in service area` }
    }
  } catch (error) {
    console.error(`Error expanding service area:`, error)
    return { success: false, error: error.message }
  }
}

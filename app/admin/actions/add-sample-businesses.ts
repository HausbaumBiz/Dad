"use server"

import { kv } from "@/lib/redis"
import { KEY_PREFIXES, saveBusinessToDb, saveBusinessCategories, saveBusinessServiceArea } from "@/lib/db-schema"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import type { Business } from "@/lib/definitions"

export async function addSampleFuneralBusinesses() {
  try {
    // Sample funeral businesses
    const sampleBusinesses = [
      {
        businessName: "Peaceful Memorial Funeral Home",
        firstName: "Robert",
        lastName: "Johnson",
        email: "info@peacefulmemorial.example",
        zipCode: "43215",
        city: "Columbus",
        state: "OH",
        services: ["Funeral Services", "Memorial Services", "Cremation"],
        serviceZipCodes: ["43215", "43220", "43201", "43202", "43204"],
        category: "mortuaryServices",
      },
      {
        businessName: "Eternal Rest Funeral Services",
        firstName: "Sarah",
        lastName: "Williams",
        email: "contact@eternalrest.example",
        zipCode: "43220",
        city: "Columbus",
        state: "OH",
        services: ["Funeral Planning", "Burial Services", "Grief Counseling"],
        serviceZipCodes: ["43220", "43221", "43235", "43214", "43085"],
        category: "mortuaryServices",
      },
      {
        businessName: "Dignity Mortuary & Cremation",
        firstName: "Michael",
        lastName: "Thompson",
        email: "info@dignitymortuary.example",
        zipCode: "43004",
        city: "Blacklick",
        state: "OH",
        services: ["Cremation", "Memorial Services", "Pre-Planning"],
        serviceZipCodes: ["43004", "43068", "43054", "43230", "43110"],
        category: "mortuaryServices",
      },
    ]

    const results = []

    // Add each business to the database
    for (const sampleBusiness of sampleBusinesses) {
      // Check if business with this email already exists
      const existingBusiness = await kv.get(`${KEY_PREFIXES.BUSINESS_EMAIL}${sampleBusiness.email}`)

      if (existingBusiness) {
        results.push({
          businessName: sampleBusiness.businessName,
          status: "skipped",
          message: "Business with this email already exists",
        })
        continue
      }

      // Generate a unique ID for the business
      const id = crypto.randomUUID()

      // Hash a default password
      const salt = await bcrypt.genSalt(10)
      const passwordHash = await bcrypt.hash("password123", salt)

      // Create business object
      const business: Business = {
        id,
        firstName: sampleBusiness.firstName,
        lastName: sampleBusiness.lastName,
        businessName: sampleBusiness.businessName,
        zipCode: sampleBusiness.zipCode,
        city: sampleBusiness.city,
        state: sampleBusiness.state,
        email: sampleBusiness.email,
        passwordHash,
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        category: sampleBusiness.category,
        services: sampleBusiness.services,
      }

      // Save business using the new schema
      await saveBusinessToDb(business)

      // Add categories
      await saveBusinessCategories(id, [
        {
          id: sampleBusiness.category,
          name: sampleBusiness.category,
          path: sampleBusiness.category,
        },
      ])

      // Add service area
      await saveBusinessServiceArea(id, {
        zipCodes: sampleBusiness.serviceZipCodes,
        isNationwide: false,
      })

      results.push({
        businessName: sampleBusiness.businessName,
        status: "added",
        message: "Successfully added to database",
        id,
      })
    }

    return {
      success: true,
      message: `Processed ${results.length} sample funeral businesses`,
      results,
    }
  } catch (error) {
    console.error("Error adding sample funeral businesses:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to add sample businesses",
      results: [],
    }
  }
}

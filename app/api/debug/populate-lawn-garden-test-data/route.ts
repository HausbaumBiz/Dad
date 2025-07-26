import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"
import { generateId } from "@/lib/utils"

export async function POST(request: NextRequest) {
  try {
    console.log("Creating test lawn care business...")

    // Generate a unique ID for the test business
    const businessId = generateId()

    // Create test business data
    const testBusiness = {
      id: businessId,
      firstName: "John",
      lastName: "Smith",
      businessName: "Green Thumb Lawn Care",
      zipCode: "12345",
      email: `test-${businessId}@example.com`,
      phone: "(555) 123-4567",
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Save the business
    await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}`, JSON.stringify(testBusiness))
    await kv.sadd(KEY_PREFIXES.BUSINESSES_SET, businessId)
    await kv.set(`${KEY_PREFIXES.BUSINESS_EMAIL}${testBusiness.email}`, businessId)

    // Add to "Lawn, Garden and Snow Removal" category
    const categoryName = "Lawn, Garden and Snow Removal"
    await kv.sadd(`${KEY_PREFIXES.CATEGORY}${categoryName}:businesses`, businessId)
    await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}:selectedCategories`, JSON.stringify([categoryName]))

    // Add detailed subcategories
    const subcategories = [
      {
        fullPath: "Home Improvement > Lawn, Garden and Snow Removal > Lawn Care",
        name: "Lawn Care",
        category: "Home Improvement",
        subcategory: "Lawn, Garden and Snow Removal",
      },
      {
        fullPath: "Home Improvement > Lawn, Garden and Snow Removal > Landscaping",
        name: "Landscaping",
        category: "Home Improvement",
        subcategory: "Lawn, Garden and Snow Removal",
      },
      {
        fullPath: "Home Improvement > Lawn, Garden and Snow Removal > Tree Service",
        name: "Tree Service",
        category: "Home Improvement",
        subcategory: "Lawn, Garden and Snow Removal",
      },
    ]

    await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}:categories`, JSON.stringify(subcategories))
    await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}:allSubcategories`, JSON.stringify(subcategories))

    // Add service area (nationwide for testing)
    await kv.set(`business:${businessId}:nationwide`, "true")
    await kv.set(
      `business:${businessId}:zipcodes`,
      JSON.stringify([{ zip: "12345", city: "Test City", state: "TS", latitude: 40.7128, longitude: -74.006 }]),
    )

    // Add ad design data
    const adDesignData = {
      designId: 1,
      colorScheme: "green",
      texture: "gradient",
      customButton: { type: "Menu", name: "Menu", icon: "Menu" },
      businessInfo: {
        businessName: "Green Thumb Lawn Care",
        streetAddress: "123 Garden St",
        city: "Test City",
        state: "TS",
        zipCode: "12345",
        phone: "(555) 123-4567",
        hours: "Mon-Fri 8AM-6PM",
        website: "www.greenthumb.com",
        freeText: "Professional lawn care services",
      },
      updatedAt: new Date().toISOString(),
    }

    await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}:adDesign`, JSON.stringify(adDesignData))
    await kv.set(
      `${KEY_PREFIXES.BUSINESS}${businessId}:adDesign:businessInfo`,
      JSON.stringify(adDesignData.businessInfo),
    )

    console.log(`Test business created with ID: ${businessId}`)

    return NextResponse.json({
      success: true,
      message: "Test lawn care business created successfully",
      businessId: businessId,
      businessName: testBusiness.businessName,
    })
  } catch (error) {
    console.error("Error creating test business:", error)
    return NextResponse.json({ success: false, error: `Failed to create test business: ${error}` }, { status: 500 })
  }
}

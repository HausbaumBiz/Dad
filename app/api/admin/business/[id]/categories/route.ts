import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 })
    }

    const key = `${KEY_PREFIXES.BUSINESS}${id}:categories`
    let categoriesData = null

    // First try to get the categories as a string (JSON)
    try {
      const jsonData = await kv.get(key)
      if (jsonData) {
        // If it's a string, parse it as JSON
        try {
          categoriesData = typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData
        } catch (parseError) {
          console.error("Error parsing categories JSON:", parseError)
          categoriesData = []
        }
      }
    } catch (getError) {
      console.error("Error getting categories as string:", getError)
      // If getting as string fails, try as set
      try {
        categoriesData = await kv.smembers(key)
      } catch (setError) {
        console.error("Error getting categories as set:", setError)
      }
    }

    // If still no data, try to get from the business object directly
    if (!categoriesData || (Array.isArray(categoriesData) && categoriesData.length === 0)) {
      try {
        const businessData = await kv.get(`${KEY_PREFIXES.BUSINESS}${id}`)
        if (businessData) {
          const business = typeof businessData === "string" ? JSON.parse(businessData) : businessData
          if (business.categories) {
            categoriesData = business.categories
          } else if (business.category) {
            categoriesData = [business.category]
          }
        }
      } catch (businessError) {
        console.error("Error getting categories from business object:", businessError)
      }
    }

    if (!categoriesData) {
      return NextResponse.json([])
    }

    // Add debug logging to see what we're returning
    console.log("Returning categories data:", categoriesData)

    return NextResponse.json(categoriesData)
  } catch (error) {
    console.error("Error fetching business categories:", error)
    return NextResponse.json({ error: "Failed to fetch business categories" }, { status: 500 })
  }
}

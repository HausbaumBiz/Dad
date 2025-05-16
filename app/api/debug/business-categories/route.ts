import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const businessId = searchParams.get("businessId")

    if (!businessId) {
      return NextResponse.json({ error: "businessId parameter is required" }, { status: 400 })
    }

    // Get business data
    const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    // Get categories data
    const categoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:categories`)
    const allCategoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:allCategories`)
    const allSubcategoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:allSubcategories`)

    // Check which category indexes the business is in
    const categoryChecks = {
      arts: {},
      automotive: {},
    }

    // Check arts categories
    const artsFormats = [
      "artDesignEntertainment",
      "Art, Design and Entertainment",
      "arts-entertainment",
      "Arts & Entertainment",
      "art-design-entertainment",
      "art-design-and-entertainment",
      "arts-&-entertainment",
    ]

    for (const format of artsFormats) {
      categoryChecks.arts[format] = await kv.sismember(`${KEY_PREFIXES.CATEGORY}${format}`, businessId)
      categoryChecks.arts[`${format}:businesses`] = await kv.sismember(
        `${KEY_PREFIXES.CATEGORY}${format}:businesses`,
        businessId,
      )
    }

    // Check automotive categories
    const autoFormats = [
      "automotive",
      "automotiveServices",
      "automotive-services",
      "Automotive Services",
      "Automotive/Motorcycle/RV",
      "auto-services",
      "autoServices",
    ]

    for (const format of autoFormats) {
      categoryChecks.automotive[format] = await kv.sismember(`${KEY_PREFIXES.CATEGORY}${format}`, businessId)
      categoryChecks.automotive[`${format}:businesses`] = await kv.sismember(
        `${KEY_PREFIXES.CATEGORY}${format}:businesses`,
        businessId,
      )
    }

    return NextResponse.json({
      business: {
        id: businessId,
        name: business.businessName,
        category: business.category,
        subcategory: business.subcategory,
      },
      categories: categoriesData,
      allCategories: allCategoriesData,
      allSubcategories: allSubcategoriesData,
      categoryIndexes: categoryChecks,
    })
  } catch (error) {
    console.error("Error fetching business categories:", error)
    return NextResponse.json({ error: "Failed to fetch business categories" }, { status: 500 })
  }
}

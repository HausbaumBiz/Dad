import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"
import { getCategoryNameForPagePath, getAllCategoryMappings } from "@/lib/category-mapping"

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const pagePath = params.path.join("/")
    console.log(`Running diagnosis for page path: ${pagePath}`)

    const diagnosis = {
      pagePath,
      timestamp: new Date().toISOString(),
      steps: [] as any[],
      summary: {} as any,
    }

    // Step 1: Check category mapping
    const categoryName = getCategoryNameForPagePath(pagePath)
    diagnosis.steps.push({
      step: "Category Mapping",
      pagePath,
      categoryName,
      success: !!categoryName,
    })

    if (!categoryName) {
      diagnosis.steps.push({
        step: "Available Mappings",
        mappings: Object.keys(getAllCategoryMappings()),
      })

      return NextResponse.json({
        success: false,
        error: "No category mapping found",
        diagnosis,
      })
    }

    // Step 2: Check category index
    const categoryKey = `${KEY_PREFIXES.CATEGORY}${categoryName}:businesses`
    const businessIds = await kv.smembers(categoryKey)

    diagnosis.steps.push({
      step: "Category Index Check",
      categoryKey,
      businessCount: businessIds?.length || 0,
      businessIds: businessIds || [],
    })

    // Step 3: Check each business
    const businessDetails = []

    if (businessIds && businessIds.length > 0) {
      for (const businessId of businessIds) {
        try {
          const businessData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)
          const categoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:categories`)
          const selectedCategoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:selectedCategories`)
          const adDesignData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:adDesign:businessInfo`)

          let parsedBusinessData = null
          let parsedCategoriesData = null
          let parsedSelectedCategories = null
          let parsedAdDesignData = null

          try {
            parsedBusinessData = typeof businessData === "string" ? JSON.parse(businessData) : businessData
          } catch (e) {
            parsedBusinessData = businessData
          }

          try {
            parsedCategoriesData = typeof categoriesData === "string" ? JSON.parse(categoriesData) : categoriesData
          } catch (e) {
            parsedCategoriesData = categoriesData
          }

          try {
            parsedSelectedCategories =
              typeof selectedCategoriesData === "string" ? JSON.parse(selectedCategoriesData) : selectedCategoriesData
          } catch (e) {
            parsedSelectedCategories = selectedCategoriesData
          }

          try {
            parsedAdDesignData = typeof adDesignData === "string" ? JSON.parse(adDesignData) : adDesignData
          } catch (e) {
            parsedAdDesignData = adDesignData
          }

          businessDetails.push({
            businessId,
            businessName: parsedBusinessData?.businessName || "Unknown",
            adDesignName: parsedAdDesignData?.businessName || null,
            registrationZip: parsedBusinessData?.zipCode || null,
            hasBusinessData: !!parsedBusinessData,
            hasCategoriesData: !!parsedCategoriesData,
            hasSelectedCategories: !!parsedSelectedCategories,
            hasAdDesignData: !!parsedAdDesignData,
            categoriesCount: Array.isArray(parsedCategoriesData) ? parsedCategoriesData.length : 0,
            selectedCategoriesCount: Array.isArray(parsedSelectedCategories) ? parsedSelectedCategories.length : 0,
          })
        } catch (error) {
          businessDetails.push({
            businessId,
            error: `Error fetching business: ${error}`,
          })
        }
      }
    }

    diagnosis.steps.push({
      step: "Business Details",
      businesses: businessDetails,
    })

    // Step 4: Check for common issues
    const issues = []

    if (!businessIds || businessIds.length === 0) {
      issues.push("No businesses found in category index")
    }

    const businessesWithoutData = businessDetails.filter((b) => !b.hasBusinessData)
    if (businessesWithoutData.length > 0) {
      issues.push(`${businessesWithoutData.length} businesses missing basic data`)
    }

    const businessesWithoutCategories = businessDetails.filter((b) => !b.hasCategoriesData && !b.hasSelectedCategories)
    if (businessesWithoutCategories.length > 0) {
      issues.push(`${businessesWithoutCategories.length} businesses missing category data`)
    }

    diagnosis.summary = {
      categoryName,
      totalBusinesses: businessIds?.length || 0,
      businessesWithData: businessDetails.filter((b) => b.hasBusinessData).length,
      businessesWithCategories: businessDetails.filter((b) => b.hasCategoriesData || b.hasSelectedCategories).length,
      businessesWithAdDesign: businessDetails.filter((b) => b.hasAdDesignData).length,
      issues,
    }

    return NextResponse.json({
      success: true,
      diagnosis,
    })
  } catch (error) {
    console.error("Error running diagnosis:", error)
    return NextResponse.json({ success: false, error: `Diagnosis failed: ${error}` }, { status: 500 })
  }
}

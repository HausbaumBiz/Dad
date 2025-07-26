import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"

export async function GET(request: NextRequest, { params }: { params: { businessId: string } }) {
  try {
    const { businessId } = params
    console.log(`Checking indexing for business: ${businessId}`)

    const indexingCheck = {
      businessId,
      timestamp: new Date().toISOString(),
      checks: [] as any[],
      issues: [] as string[],
      recommendations: [] as string[],
    }

    // Check 1: Basic business data
    const businessData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)
    const hasBusinessData = !!businessData

    let parsedBusinessData = null
    if (businessData) {
      try {
        parsedBusinessData = typeof businessData === "string" ? JSON.parse(businessData) : businessData
      } catch (e) {
        parsedBusinessData = businessData
      }
    }

    indexingCheck.checks.push({
      check: "Basic Business Data",
      passed: hasBusinessData,
      data: parsedBusinessData
        ? {
            businessName: parsedBusinessData.businessName,
            email: parsedBusinessData.email,
            zipCode: parsedBusinessData.zipCode,
          }
        : null,
    })

    if (!hasBusinessData) {
      indexingCheck.issues.push("Business data not found")
      indexingCheck.recommendations.push("Ensure business is properly registered")
    }

    // Check 2: Business in main businesses set
    const inBusinessesSet = await kv.sismember(KEY_PREFIXES.BUSINESSES_SET, businessId)
    indexingCheck.checks.push({
      check: "In Businesses Set",
      passed: inBusinessesSet,
    })

    if (!inBusinessesSet) {
      indexingCheck.issues.push("Business not in main businesses set")
      indexingCheck.recommendations.push("Add business to main businesses set")
    }

    // Check 3: Email index
    let emailIndexCorrect = false
    if (parsedBusinessData?.email) {
      const emailIndexId = await kv.get(`${KEY_PREFIXES.BUSINESS_EMAIL}${parsedBusinessData.email.toLowerCase()}`)
      emailIndexCorrect = emailIndexId === businessId

      indexingCheck.checks.push({
        check: "Email Index",
        passed: emailIndexCorrect,
        expected: businessId,
        actual: emailIndexId,
      })

      if (!emailIndexCorrect) {
        indexingCheck.issues.push("Email index incorrect or missing")
        indexingCheck.recommendations.push("Fix email index mapping")
      }
    }

    // Check 4: Selected categories
    const selectedCategoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:selectedCategories`)
    let selectedCategories = []

    if (selectedCategoriesData) {
      try {
        selectedCategories =
          typeof selectedCategoriesData === "string" ? JSON.parse(selectedCategoriesData) : selectedCategoriesData
        if (!Array.isArray(selectedCategories)) {
          selectedCategories = []
        }
      } catch (e) {
        selectedCategories = []
      }
    }

    indexingCheck.checks.push({
      check: "Selected Categories",
      passed: selectedCategories.length > 0,
      categories: selectedCategories,
    })

    if (selectedCategories.length === 0) {
      indexingCheck.issues.push("No selected categories found")
      indexingCheck.recommendations.push("Add business to appropriate categories")
    }

    // Check 5: Category indexes
    const categoryIndexChecks = []
    for (const categoryName of selectedCategories) {
      const categoryKey = `${KEY_PREFIXES.CATEGORY}${categoryName}:businesses`
      const inCategoryIndex = await kv.sismember(categoryKey, businessId)

      categoryIndexChecks.push({
        category: categoryName,
        key: categoryKey,
        indexed: inCategoryIndex,
      })

      if (!inCategoryIndex) {
        indexingCheck.issues.push(`Not indexed in category: ${categoryName}`)
        indexingCheck.recommendations.push(`Add business to category index: ${categoryName}`)
      }
    }

    indexingCheck.checks.push({
      check: "Category Indexes",
      passed: categoryIndexChecks.every((c) => c.indexed),
      details: categoryIndexChecks,
    })

    // Check 6: Detailed categories data
    const categoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:categories`)
    let detailedCategories = []

    if (categoriesData) {
      try {
        detailedCategories = typeof categoriesData === "string" ? JSON.parse(categoriesData) : categoriesData
        if (!Array.isArray(detailedCategories)) {
          detailedCategories = []
        }
      } catch (e) {
        detailedCategories = []
      }
    }

    indexingCheck.checks.push({
      check: "Detailed Categories Data",
      passed: detailedCategories.length > 0,
      count: detailedCategories.length,
      sample: detailedCategories.slice(0, 3),
    })

    // Check 7: Ad design data
    const adDesignData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:adDesign:businessInfo`)
    let parsedAdDesignData = null

    if (adDesignData) {
      try {
        parsedAdDesignData = typeof adDesignData === "string" ? JSON.parse(adDesignData) : adDesignData
      } catch (e) {
        parsedAdDesignData = adDesignData
      }
    }

    indexingCheck.checks.push({
      check: "Ad Design Data",
      passed: !!parsedAdDesignData,
      hasBusinessName: !!parsedAdDesignData?.businessName,
      businessName: parsedAdDesignData?.businessName,
    })

    // Summary
    const totalChecks = indexingCheck.checks.length
    const passedChecks = indexingCheck.checks.filter((c) => c.passed).length

    return NextResponse.json({
      success: true,
      indexingCheck: {
        ...indexingCheck,
        summary: {
          totalChecks,
          passedChecks,
          score: `${passedChecks}/${totalChecks}`,
          overallHealth:
            passedChecks === totalChecks
              ? "Excellent"
              : passedChecks >= totalChecks * 0.8
                ? "Good"
                : passedChecks >= totalChecks * 0.6
                  ? "Fair"
                  : "Poor",
        },
      },
    })
  } catch (error) {
    console.error("Error checking business indexing:", error)
    return NextResponse.json({ success: false, error: `Failed to check indexing: ${error}` }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { businessId: string } }) {
  try {
    const { businessId } = params
    console.log(`Fixing indexing for business: ${businessId}`)

    const fixes = []
    let fixesApplied = 0

    // Get business data first
    const businessData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)
    if (!businessData) {
      return NextResponse.json({
        success: false,
        error: "Business data not found - cannot fix indexing",
      })
    }

    let parsedBusinessData
    try {
      parsedBusinessData = typeof businessData === "string" ? JSON.parse(businessData) : businessData
    } catch (e) {
      parsedBusinessData = businessData
    }

    // Fix 1: Add to businesses set
    const inBusinessesSet = await kv.sismember(KEY_PREFIXES.BUSINESSES_SET, businessId)
    if (!inBusinessesSet) {
      await kv.sadd(KEY_PREFIXES.BUSINESSES_SET, businessId)
      fixes.push("Added to main businesses set")
      fixesApplied++
    }

    // Fix 2: Fix email index
    if (parsedBusinessData?.email) {
      const emailKey = `${KEY_PREFIXES.BUSINESS_EMAIL}${parsedBusinessData.email.toLowerCase()}`
      const currentEmailIndex = await kv.get(emailKey)

      if (currentEmailIndex !== businessId) {
        await kv.set(emailKey, businessId)
        fixes.push("Fixed email index")
        fixesApplied++
      }
    }

    // Fix 3: Ensure category indexing
    const selectedCategoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:selectedCategories`)
    let selectedCategories = []

    if (selectedCategoriesData) {
      try {
        selectedCategories =
          typeof selectedCategoriesData === "string" ? JSON.parse(selectedCategoriesData) : selectedCategoriesData
        if (!Array.isArray(selectedCategories)) {
          selectedCategories = []
        }
      } catch (e) {
        selectedCategories = []
      }
    }

    // If no selected categories, try to infer from detailed categories
    if (selectedCategories.length === 0) {
      const categoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:categories`)
      if (categoriesData) {
        try {
          const detailedCategories = typeof categoriesData === "string" ? JSON.parse(categoriesData) : categoriesData
          if (Array.isArray(detailedCategories)) {
            // Extract main categories from detailed data
            const mainCategories = [
              ...new Set(detailedCategories.map((cat) => cat.subcategory || cat.category).filter(Boolean)),
            ]
            if (mainCategories.length > 0) {
              selectedCategories = mainCategories
              await kv.set(
                `${KEY_PREFIXES.BUSINESS}${businessId}:selectedCategories`,
                JSON.stringify(selectedCategories),
              )
              fixes.push(`Inferred selected categories: ${mainCategories.join(", ")}`)
              fixesApplied++
            }
          }
        } catch (e) {
          console.error("Error parsing detailed categories:", e)
        }
      }
    }

    // Fix category indexes
    for (const categoryName of selectedCategories) {
      const categoryKey = `${KEY_PREFIXES.CATEGORY}${categoryName}:businesses`
      const inCategoryIndex = await kv.sismember(categoryKey, businessId)

      if (!inCategoryIndex) {
        await kv.sadd(categoryKey, businessId)
        fixes.push(`Added to category index: ${categoryName}`)
        fixesApplied++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Applied ${fixesApplied} fixes`,
      fixes,
      businessId,
      businessName: parsedBusinessData?.businessName || "Unknown",
    })
  } catch (error) {
    console.error("Error fixing business indexing:", error)
    return NextResponse.json({ success: false, error: `Failed to fix indexing: ${error}` }, { status: 500 })
  }
}

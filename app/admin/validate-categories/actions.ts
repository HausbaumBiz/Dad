"use server"

import { kv } from "@vercel/kv"

export interface ValidationIssue {
  type: "critical" | "warning" | "info"
  category: string
  description: string
  businessId: string | null
  details: Record<string, any>
}

export interface ValidationSummary {
  totalBusinesses: number
  businessesWithCategories: number
  totalCategoryIndexes: number
  validIndexes: number
  corruptedIndexes: number
  orphanedIndexes: number
  missingIndexes: number
  inconsistentBusinesses: number
}

export interface ValidationResult {
  isValid: boolean
  summary: ValidationSummary
  issues: ValidationIssue[]
  recommendations: string[]
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  return String(error)
}

export async function validateCategoryIntegrity(): Promise<ValidationResult> {
  const issues: ValidationIssue[] = []
  const summary: ValidationSummary = {
    totalBusinesses: 0,
    businessesWithCategories: 0,
    totalCategoryIndexes: 0,
    validIndexes: 0,
    corruptedIndexes: 0,
    orphanedIndexes: 0,
    missingIndexes: 0,
    inconsistentBusinesses: 0,
  }

  try {
    // Get all businesses
    const businessIds = await kv.smembers("businesses")
    const allBusinessIds = Array.isArray(businessIds) ? businessIds.map((id) => String(id)) : []
    summary.totalBusinesses = allBusinessIds.length

    // Get all category indexes
    const categoryKeys = await kv.keys("category:*")
    summary.totalCategoryIndexes = categoryKeys.length

    // Track categories found in businesses vs indexes
    const categoriesInBusinesses = new Set<string>()
    const categoriesInIndexes = new Set<string>()
    const businessCategoryMap = new Map<string, string[]>()

    // Validate each business
    for (const businessId of allBusinessIds) {
      try {
        const businessData = await kv.get(`business:${businessId}`)

        if (!businessData) {
          issues.push({
            type: "warning",
            category: "business",
            description: "Business data not found",
            businessId,
            details: { businessId },
          })
          continue
        }

        let business: any
        try {
          business = typeof businessData === "string" ? JSON.parse(businessData) : businessData
        } catch (parseError) {
          issues.push({
            type: "critical",
            category: "business",
            description: "Business data is corrupted (invalid JSON)",
            businessId,
            details: { parseError: getErrorMessage(parseError) },
          })
          continue
        }

        // Check if business has categories
        const businessCategories: string[] = []

        if (business.category) {
          businessCategories.push(business.category)
          categoriesInBusinesses.add(business.category)
        }

        if (business.subcategory) {
          businessCategories.push(business.subcategory)
          categoriesInBusinesses.add(business.subcategory)
        }

        if (business.allCategories && Array.isArray(business.allCategories)) {
          business.allCategories.forEach((cat: string) => {
            businessCategories.push(cat)
            categoriesInBusinesses.add(cat)
          })
        }

        if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
          business.allSubcategories.forEach((cat: string) => {
            businessCategories.push(cat)
            categoriesInBusinesses.add(cat)
          })
        }

        if (businessCategories.length > 0) {
          summary.businessesWithCategories++
          businessCategoryMap.set(businessId, [...new Set(businessCategories)])
        }

        // Validate category count consistency
        const expectedCount = (business.allCategories?.length || 0) + (business.allSubcategories?.length || 0)
        if (business.categoriesCount !== expectedCount) {
          issues.push({
            type: "warning",
            category: "consistency",
            description: "Category count mismatch",
            businessId,
            details: {
              expected: expectedCount,
              actual: business.categoriesCount,
              allCategories: business.allCategories,
              allSubcategories: business.allSubcategories,
            },
          })
          summary.inconsistentBusinesses++
        }
      } catch (error) {
        issues.push({
          type: "critical",
          category: "business",
          description: "Error processing business data",
          businessId,
          details: { error: getErrorMessage(error) },
        })
      }
    }

    // Validate each category index
    for (const categoryKey of categoryKeys) {
      try {
        const categoryName = categoryKey.replace("category:", "")
        categoriesInIndexes.add(categoryName)

        // Check if the category index is accessible
        let businesses: any
        try {
          businesses = await kv.smembers(categoryKey)
        } catch (error) {
          issues.push({
            type: "critical",
            category: "index",
            description: "Category index is corrupted",
            businessId: null,
            details: {
              categoryKey,
              error: getErrorMessage(error),
            },
          })
          summary.corruptedIndexes++
          continue
        }

        summary.validIndexes++

        // Ensure businesses is an array
        const businessList = Array.isArray(businesses) ? businesses.map((id) => String(id)) : []

        // Check for orphaned businesses in category index
        for (const businessId of businessList) {
          if (!allBusinessIds.includes(businessId)) {
            issues.push({
              type: "warning",
              category: "orphaned",
              description: "Business in category index but doesn't exist",
              businessId,
              details: { categoryKey, businessId },
            })
          } else {
            // Check if business actually has this category
            const businessCategories = businessCategoryMap.get(businessId) || []
            const hasCategory = businessCategories.some(
              (cat) =>
                cat === categoryName ||
                cat.replace(/[-_]/g, "") === categoryName.replace(/[-_]/g, "") ||
                cat.toLowerCase() === categoryName.toLowerCase(),
            )

            if (!hasCategory) {
              issues.push({
                type: "warning",
                category: "inconsistent",
                description: "Business in category index but doesn't have the category",
                businessId,
                details: {
                  categoryKey,
                  businessCategories,
                  expectedCategory: categoryName,
                },
              })
              summary.inconsistentBusinesses++
            }
          }
        }
      } catch (error) {
        issues.push({
          type: "critical",
          category: "index",
          description: "Error processing category index",
          businessId: null,
          details: { categoryKey, error: getErrorMessage(error) },
        })
        summary.corruptedIndexes++
      }
    }

    // Check for missing category indexes
    for (const category of categoriesInBusinesses) {
      const normalizedCategory = category.toLowerCase().replace(/\s+/g, "-")
      const possibleKeys = [
        `category:${category}`,
        `category:${normalizedCategory}`,
        `category:${category.replace(/\s+/g, "_")}`,
        `category:${category.replace(/\s+/g, "")}`,
      ]

      const hasIndex = possibleKeys.some((key) => categoryKeys.includes(key))

      if (!hasIndex) {
        issues.push({
          type: "warning",
          category: "missing",
          description: "Category used by businesses but has no index",
          businessId: null,
          details: {
            category,
            possibleKeys,
            businessesUsingCategory: Array.from(businessCategoryMap.entries())
              .filter(([_, cats]) => cats.includes(category))
              .map(([id]) => id),
          },
        })
        summary.missingIndexes++
      }
    }

    // Check for orphaned category indexes
    for (const category of categoriesInIndexes) {
      const isUsed = Array.from(categoriesInBusinesses).some(
        (businessCat) =>
          businessCat === category ||
          businessCat.toLowerCase().replace(/\s+/g, "-") === category ||
          businessCat.replace(/\s+/g, "_") === category ||
          businessCat.replace(/\s+/g, "") === category,
      )

      if (!isUsed) {
        issues.push({
          type: "info",
          category: "orphaned",
          description: "Category index exists but no businesses use it",
          businessId: null,
          details: { category },
        })
        summary.orphanedIndexes++
      }
    }

    // Generate recommendations
    const recommendations: string[] = []

    if (summary.corruptedIndexes > 0) {
      recommendations.push("Remove corrupted category indexes and rebuild them from business data")
    }

    if (summary.orphanedIndexes > 0) {
      recommendations.push("Remove orphaned category indexes that are no longer used")
    }

    if (summary.missingIndexes > 0) {
      recommendations.push("Create missing category indexes for categories used by businesses")
    }

    if (summary.inconsistentBusinesses > 0) {
      recommendations.push("Fix category count inconsistencies in business data")
    }

    if (issues.length === 0) {
      recommendations.push("Category data is healthy - no action needed")
    }

    const isValid =
      issues.filter((issue) => issue.type === "critical").length === 0 &&
      summary.corruptedIndexes === 0 &&
      summary.inconsistentBusinesses === 0

    return {
      isValid,
      summary,
      issues,
      recommendations,
    }
  } catch (error) {
    throw new Error(`Validation failed: ${getErrorMessage(error)}`)
  }
}

export async function fixCategoryIssues(): Promise<{ success: boolean; message: string; fixed: number }> {
  try {
    let fixedCount = 0

    // Get current validation to know what to fix
    const validation = await validateCategoryIntegrity()

    // Fix 1: Remove corrupted category indexes
    for (const issue of validation.issues) {
      if (issue.type === "critical" && issue.category === "index") {
        try {
          const categoryKey = issue.details.categoryKey
          await kv.del(categoryKey)
          fixedCount++
        } catch (error) {
          console.error("Error removing corrupted index:", error)
        }
      }
    }

    // Fix 2: Remove orphaned category indexes
    for (const issue of validation.issues) {
      if (issue.category === "orphaned" && issue.details.category) {
        try {
          const categoryKey = `category:${issue.details.category}`
          await kv.del(categoryKey)
          fixedCount++
        } catch (error) {
          console.error("Error removing orphaned index:", error)
        }
      }
    }

    // Fix 3: Rebuild category indexes from business data
    const businessIds = await kv.smembers("businesses")
    const allBusinessIds = Array.isArray(businessIds) ? businessIds.map((id) => String(id)) : []

    const categoryBusinessMap = new Map<string, Set<string>>()

    for (const businessId of allBusinessIds) {
      try {
        const businessData = await kv.get(`business:${businessId}`)
        if (!businessData) continue

        const business = typeof businessData === "string" ? JSON.parse(businessData) : businessData
        const categories: string[] = []

        if (business.category) categories.push(business.category)
        if (business.subcategory) categories.push(business.subcategory)
        if (business.allCategories) categories.push(...business.allCategories)
        if (business.allSubcategories) categories.push(...business.allSubcategories)

        for (const category of categories) {
          if (!categoryBusinessMap.has(category)) {
            categoryBusinessMap.set(category, new Set())
          }
          categoryBusinessMap.get(category)!.add(businessId)
        }

        // Fix category count
        const expectedCount = (business.allCategories?.length || 0) + (business.allSubcategories?.length || 0)
        if (business.categoriesCount !== expectedCount) {
          business.categoriesCount = expectedCount
          business.updatedAt = new Date().toISOString()
          await kv.set(`business:${businessId}`, JSON.stringify(business))
          fixedCount++
        }
      } catch (error) {
        console.error(`Error processing business ${businessId}:`, error)
      }
    }

    // Rebuild category indexes
    for (const [category, businessIds] of categoryBusinessMap) {
      try {
        const categoryKey = `category:${category.toLowerCase().replace(/\s+/g, "-")}`
        await kv.del(categoryKey) // Clear existing
        if (businessIds.size > 0) {
          await kv.sadd(categoryKey, ...Array.from(businessIds))
          fixedCount++
        }
      } catch (error) {
        console.error(`Error rebuilding category ${category}:`, error)
      }
    }

    return {
      success: true,
      message: `Successfully fixed ${fixedCount} category issues`,
      fixed: fixedCount,
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to fix issues: ${getErrorMessage(error)}`,
      fixed: 0,
    }
  }
}

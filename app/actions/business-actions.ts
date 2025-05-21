"use server"

import { kv } from "@/lib/redis"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import type { Business } from "@/lib/definitions"
import {
  saveBusinessToDb,
  saveBusinessCategories,
  saveBusinessServiceArea,
  getBusinessesByCategory as getBusinessesByCategoryFromDb,
  getBusinessesByZipCode as getBusinessesByZipCodeFromDb,
  getBusinessesByCategoryAndZipCode as getBusinessesByCategoryAndZipCodeFromDb,
  KEY_PREFIXES,
  type CategoryData,
} from "@/lib/db-schema"

// Get all businesses
export async function getBusinesses(): Promise<Business[]> {
  try {
    console.log("Fetching all businesses")

    // Get all business IDs from the set
    const businessIds = (await kv.smembers(KEY_PREFIXES.BUSINESSES_SET)) as string[]

    console.log(`Found ${businessIds.length} business IDs`)

    if (!businessIds || businessIds.length === 0) {
      return []
    }

    // Fetch each business's data
    const businessesPromises = businessIds.map(async (id) => {
      try {
        const business = (await kv.get(`${KEY_PREFIXES.BUSINESS}${id}`)) as Business | null
        return business ? { ...business, id } : null
      } catch (err) {
        console.error(`Error fetching business ${id}:`, err)
        return null
      }
    })

    const businesses = (await Promise.all(businessesPromises)).filter(Boolean) as Business[]

    console.log(`Successfully fetched ${businesses.length} businesses`)

    // Sort by creation date (newest first)
    return businesses.sort((a, b) => {
      const dateA = new Date(a.createdAt || "").getTime()
      const dateB = new Date(b.createdAt || "").getTime()
      return dateB - dateA
    })
  } catch (error) {
    console.error("Error fetching businesses:", error)
    return []
  }
}

// Get a business by ID
export async function getBusinessById(id: string): Promise<Business | null> {
  try {
    if (!id) return null

    const business = (await kv.get(`${KEY_PREFIXES.BUSINESS}${id}`)) as Business | null

    if (!business) {
      return null
    }

    return { ...business, id }
  } catch (error) {
    console.error(`Error fetching business with ID ${id}:`, error)
    return null
  }
}

// Delete a business
export async function deleteBusiness(id: string): Promise<{ success: boolean; message: string }> {
  console.log(`Starting deletion of business with ID: ${id}`)

  try {
    // Get the business first to get the email
    const business = await getBusinessById(id)

    if (!business) {
      console.log(`Business with ID ${id} not found`)
      return { success: false, message: "Business not found" }
    }

    console.log(`Found business: ${business.businessName} (${id})`)

    // Remove business from email index
    if (business.email) {
      console.log(`Removing business from email index: ${business.email}`)
      await kv.del(`${KEY_PREFIXES.BUSINESS_EMAIL}${business.email.toLowerCase()}`)
    }

    // Remove business from category index if it has one
    if (business.category) {
      console.log(`Removing business from category index: ${business.category}`)
      await kv.srem(`${KEY_PREFIXES.CATEGORY}${business.category}`, id)
    }

    // Get business categories and remove from indexes
    try {
      const categoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${id}:categories`)
      if (categoriesData) {
        let categories: CategoryData[] = []

        if (typeof categoriesData === "string") {
          try {
            categories = JSON.parse(categoriesData)
          } catch (e) {
            console.error("Error parsing categories data:", e)
          }
        } else if (Array.isArray(categoriesData)) {
          categories = categoriesData
        }

        // Remove from category indexes
        for (const category of categories) {
          await kv.srem(`${KEY_PREFIXES.CATEGORY}${category.id}`, id)

          if (category.parentId) {
            await kv.srem(`${KEY_PREFIXES.CATEGORY}${category.parentId}:${category.id}`, id)
          }

          if (category.path) {
            await kv.srem(`${KEY_PREFIXES.CATEGORY}path:${category.path}`, id)
          }
        }
      }
    } catch (error) {
      console.error(`Error removing business ${id} from category indexes:`, error)
    }

    // Get business zip codes and remove from indexes
    try {
      let zipCodes: string[] = []

      // First try to get zip codes as a set (smembers)
      try {
        zipCodes = await kv.smembers(`${KEY_PREFIXES.BUSINESS}${id}:zipcodes`)
      } catch (setError) {
        console.log("Zip codes not stored as a set, trying as a string value:", setError)

        // If that fails, try to get it as a string (get)
        try {
          const zipCodesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${id}:zipcodes`)
          if (zipCodesData) {
            if (typeof zipCodesData === "string") {
              try {
                zipCodes = JSON.parse(zipCodesData)
              } catch (parseError) {
                console.error("Error parsing zip codes data:", parseError)
                // If it's a string but not JSON, it might be a single zip code
                zipCodes = [zipCodesData]
              }
            } else if (Array.isArray(zipCodesData)) {
              zipCodes = zipCodesData
            }
          }
        } catch (getError) {
          console.error("Error getting zip codes as string:", getError)
        }
      }

      console.log(`Found ${zipCodes.length} zip codes for business ${id}:`, zipCodes)

      // Remove business from each zip code's index
      for (const zipCode of zipCodes) {
        if (typeof zipCode === "string") {
          await kv.srem(`${KEY_PREFIXES.ZIPCODE}${zipCode}:businesses`, id)
        }
      }
    } catch (error) {
      console.error(`Error removing business ${id} from zip code indexes:`, error)
    }

    // Remove business from the set of all businesses
    console.log(`Removing business from the set of all businesses`)
    await kv.srem(KEY_PREFIXES.BUSINESSES_SET, id)

    // Delete any associated data
    console.log(`Deleting associated data for business ${id}`)
    await kv.del(`${KEY_PREFIXES.BUSINESS}${id}:adDesign`)
    await kv.del(`${KEY_PREFIXES.BUSINESS}${id}:categories`)
    await kv.del(`${KEY_PREFIXES.BUSINESS}${id}:zipcodes`)
    await kv.del(`${KEY_PREFIXES.BUSINESS}${id}:nationwide`)
    await kv.del(`${KEY_PREFIXES.BUSINESS}${id}:serviceArea`)

    // Delete the business data
    console.log(`Deleting business data for ${id}`)
    await kv.del(`${KEY_PREFIXES.BUSINESS}${id}`)

    // Revalidate paths
    console.log(`Revalidating paths`)
    revalidatePath("/admin/businesses")

    console.log(`Business deleted successfully: ${business.businessName} (${id})`)

    return {
      success: true,
      message: `Business ${business.businessName} successfully deleted`,
    }
  } catch (error) {
    console.error(`Error deleting business with ID ${id}:`, error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete business",
    }
  }
}

// Register a new business
export async function registerBusiness(formData: FormData) {
  try {
    // Extract form data
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const businessName = formData.get("businessName") as string
    const zipCode = formData.get("zipCode") as string
    const email = (formData.get("email") as string).toLowerCase()
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string
    const category = (formData.get("category") as string) || ""

    // Validate form data
    if (!firstName || !lastName || !businessName || !zipCode || !email || !password || !confirmPassword) {
      return { success: false, message: "All fields are required" }
    }

    if (password !== confirmPassword) {
      return { success: false, message: "Passwords do not match" }
    }

    // Check if business with this email already exists
    const existingBusiness = await kv.get(`${KEY_PREFIXES.BUSINESS_EMAIL}${email}`)
    if (existingBusiness) {
      return { success: false, message: `Email ${email} already registered` }
    }

    // Generate a unique ID for the business
    const id = crypto.randomUUID()

    // Hash the password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    // Create business object
    const business: Business = {
      id,
      firstName,
      lastName,
      businessName,
      zipCode,
      email,
      passwordHash,
      isEmailVerified: true, // For simplicity, we're setting this to true by default
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category,
    }

    // Save business using the new schema
    await saveBusinessToDb(business)

    // If category is provided, add as a standardized category
    if (category) {
      await saveBusinessCategories(id, [
        {
          id: category,
          name: category,
          path: category,
        },
      ])
    }

    // Add business's own zip code to its service area
    await saveBusinessServiceArea(id, {
      zipCodes: [zipCode],
      isNationwide: false,
    })

    // Set a cookie with the business ID
    cookies().set("businessId", id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    console.log(`Business registered: ${businessName} (${id})`)

    // Return success with redirect URL instead of directly redirecting
    return {
      success: true,
      message: "Registration successful",
      redirectUrl: "/legal-notice",
    }
  } catch (error) {
    console.error("Business registration failed:", error)
    return { success: false, message: "Registration failed. Please try again." }
  }
}

// Login a business
export async function loginBusiness(formData: FormData) {
  try {
    const email = (formData.get("email") as string).toLowerCase()
    const password = formData.get("password") as string
    const rememberMe = formData.get("rememberMe") === "on"

    // Validate form data
    if (!email || !password) {
      return { success: false, message: "Email and password are required" }
    }

    // Get business ID by email
    const businessId = await kv.get(`${KEY_PREFIXES.BUSINESS_EMAIL}${email}`)
    if (!businessId) {
      return { success: false, message: "Invalid email or password" }
    }

    // Get business by ID
    const business = (await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)) as Business
    if (!business) {
      return { success: false, message: "Invalid email or password" }
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, business.passwordHash || "")
    if (!isPasswordValid) {
      return { success: false, message: "Invalid email or password" }
    }

    // Check if email is verified
    if (!business.isEmailVerified) {
      return { success: false, message: "Please verify your email before logging in" }
    }

    // Set cookie with business ID
    cookies().set("businessId", business.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7, // 30 days if remember me, otherwise 7 days
      path: "/",
    })

    console.log(`Business logged in: ${business.businessName} (${business.id})`)

    // Return success with redirect URL instead of directly redirecting
    return {
      success: true,
      message: "Login successful",
      redirectUrl: "/workbench",
    }
  } catch (error) {
    console.error("Business login failed:", error)
    return { success: false, message: "Login failed. Please try again." }
  }
}

// Update getCurrentBusiness to ensure we get the correct business ID
export async function getCurrentBusiness() {
  try {
    // Check if KV environment variables are available
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.warn("KV environment variables are missing. Using mock data for development.")
      // Return mock data for development/preview
      return {
        id: "demo-business", // Use a consistent ID for development
        firstName: "Demo",
        lastName: "User",
        businessName: "Demo Business",
        zipCode: "12345",
        email: "demo@example.com",
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }

    const businessId = cookies().get("businessId")?.value
    if (!businessId) {
      console.log("No businessId cookie found")
      return null
    }

    console.log(`Fetching business with ID: ${businessId}`)
    const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)

    if (!business) {
      console.log(`No business found with ID: ${businessId}`)
      // Don't delete the cookie here, let the client handle redirection
      return null
    }

    // Make sure the ID is included in the returned object
    return { ...(business as Business), id: businessId }
  } catch (error) {
    console.error("Error getting current business:", error)
    // In case of error, return null instead of mock data to trigger proper error handling
    return null
  }
}

// Logout the current business
export async function logoutBusiness() {
  try {
    cookies().delete("businessId")
    return { success: true }
  } catch (error) {
    console.error("Error during logout:", error)
    return { success: false, error: "Failed to logout" }
  }
}

// Check if a business email exists
export async function checkBusinessEmailExists(email: string) {
  try {
    const normalizedEmail = email.toLowerCase()
    const businessId = await kv.get(`${KEY_PREFIXES.BUSINESS_EMAIL}${normalizedEmail}`)
    return !!businessId
  } catch (error) {
    console.error("Error checking business email:", error)
    return false
  }
}

// Get businesses by category - using the new schema
export async function getBusinessesByCategory(category: string) {
  return getBusinessesByCategoryFromDb(category)
}

// Get businesses by zip code - using the new schema
export async function getBusinessesByZipCode(zipCode: string) {
  return getBusinessesByZipCodeFromDb(zipCode)
}

// Get businesses by category and zip code - using the new schema
export async function getBusinessesByCategoryAndZipCode(category: string, zipCode: string) {
  return getBusinessesByCategoryAndZipCodeFromDb(category, zipCode)
}

// Add this function to save the business ad design
export async function saveBusinessAdDesign(businessId: string, designData: any) {
  try {
    if (!businessId) {
      return { success: false, error: "Missing business ID" }
    }

    console.log("Saving business ad design:", designData)

    // Define the keys we'll be using
    const mainKey = `${KEY_PREFIXES.BUSINESS}${businessId}:adDesign`
    const colorsKey = `${KEY_PREFIXES.BUSINESS}${businessId}:adDesign:colors`
    const businessInfoKey = `${KEY_PREFIXES.BUSINESS}${businessId}:adDesign:businessInfo`
    const hiddenFieldsKey = `${KEY_PREFIXES.BUSINESS}${businessId}:adDesign:hiddenFields`

    // Delete existing keys to avoid type conflicts
    await kv.del(mainKey)
    await kv.del(colorsKey)
    await kv.del(businessInfoKey)
    await kv.del(hiddenFieldsKey)

    // Store design data as JSON string instead of hash to avoid type conflicts
    await kv.set(
      mainKey,
      JSON.stringify({
        designId: designData.designId,
        colorScheme: designData.colorScheme,
        customButton: designData.customButton || { type: "Menu", name: "Menu", icon: "Menu" },
        updatedAt: new Date().toISOString(),
      }),
    )

    // Store the color values
    if (designData.colorValues) {
      await kv.set(
        colorsKey,
        JSON.stringify({
          ...designData.colorValues,
          colorScheme: designData.colorScheme,
        }),
      )
    }

    // Store the business information
    if (designData.businessInfo) {
      await kv.set(businessInfoKey, JSON.stringify(designData.businessInfo))
    }

    // Store the hidden fields settings
    if (designData.hiddenFields) {
      await kv.set(hiddenFieldsKey, JSON.stringify(designData.hiddenFields))
    }

    revalidatePath(`/ad-design/customize`)
    revalidatePath(`/workbench`)

    return { success: true }
  } catch (error) {
    console.error("Error saving business ad design:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save ad design",
    }
  }
}

// Update the getBusinessAdDesign function to ensure proper data retrieval
export async function getBusinessAdDesign(businessId: string) {
  try {
    if (!businessId) {
      console.log("No business ID provided to getBusinessAdDesign")
      return null
    }

    console.log(`Getting ad design for business ID: ${businessId}`)

    // Define the keys we'll be using
    const mainKey = `${KEY_PREFIXES.BUSINESS}${businessId}:adDesign`
    const colorsKey = `${KEY_PREFIXES.BUSINESS}${businessId}:adDesign:colors`
    const businessInfoKey = `${KEY_PREFIXES.BUSINESS}${businessId}:adDesign:businessInfo`
    const hiddenFieldsKey = `${KEY_PREFIXES.BUSINESS}${businessId}:adDesign:hiddenFields`

    // Get the design data from KV
    let designData = null
    try {
      const designDataStr = await kv.get(mainKey)
      console.log(`Main design data (${mainKey}):`, designDataStr)

      if (designDataStr) {
        designData = typeof designDataStr === "string" ? JSON.parse(designDataStr) : designDataStr
      }
    } catch (error) {
      console.error("Error getting main design data:", error)
    }

    // Get the color values
    let colorValues = null
    try {
      const colorValuesStr = await kv.get(colorsKey)
      console.log(`Color values (${colorsKey}):`, colorValuesStr)

      if (colorValuesStr) {
        colorValues = typeof colorValuesStr === "string" ? JSON.parse(colorValuesStr) : colorValuesStr
      }
    } catch (error) {
      console.error("Error getting color values:", error)
    }

    // Get the business information
    let businessInfo = null
    try {
      const businessInfoStr = await kv.get(businessInfoKey)
      console.log(`Business info (${businessInfoKey}):`, businessInfoStr)

      if (businessInfoStr) {
        businessInfo = typeof businessInfoStr === "string" ? JSON.parse(businessInfoStr) : businessInfoStr
      }
    } catch (error) {
      console.error("Error getting business info:", error)
    }

    // Get the hidden fields settings
    let hiddenFields = null
    try {
      const hiddenFieldsStr = await kv.get(hiddenFieldsKey)
      console.log(`Hidden fields (${hiddenFieldsKey}):`, hiddenFieldsStr)

      if (hiddenFieldsStr) {
        hiddenFields = typeof hiddenFieldsStr === "string" ? JSON.parse(hiddenFieldsStr) : hiddenFieldsStr
      }
    } catch (error) {
      console.error("Error getting hidden fields:", error)
    }

    // If we don't have any design data, try to get it from the old format
    if (!designData) {
      try {
        // Try to get the data in the old format (as a single object)
        const oldFormatData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:adDesign`)
        console.log("Trying old format data:", oldFormatData)

        if (oldFormatData) {
          let parsedData
          if (typeof oldFormatData === "string") {
            parsedData = JSON.parse(oldFormatData)
          } else {
            parsedData = oldFormatData
          }

          // Extract the components from the old format
          designData = {
            designId: parsedData.designId || 5,
            colorScheme: parsedData.colorScheme || "blue",
            updatedAt: parsedData.updatedAt || new Date().toISOString(),
          }

          businessInfo = parsedData.businessInfo || {}
          colorValues = parsedData.colorValues || {}
          hiddenFields = parsedData.hiddenFields || {}

          console.log("Successfully retrieved data from old format")
        }
      } catch (error) {
        console.error("Error getting data from old format:", error)
      }
    }

    if (!designData) {
      console.log("No design data found for business ID:", businessId)
      return null
    }

    // Ensure businessInfo has all required fields with default values
    const defaultBusinessInfo = {
      businessName: "",
      streetAddress: "",
      city: "",
      state: "",
      zipCode: "",
      phone: "",
      hours: "",
      website: "",
      freeText: "",
    }

    // Ensure customButton is included in the returned data
    const result = {
      ...designData,
      colorValues: colorValues || {},
      businessInfo: { ...defaultBusinessInfo, ...(businessInfo || {}) },
      hiddenFields: hiddenFields || {},
      customButton: designData.customButton || { type: "Menu", name: "Menu", icon: "Menu" },
    }

    console.log("Final combined ad design data:", result)
    return result
  } catch (error) {
    console.error("Error getting business ad design:", error)
    return null
  }
}

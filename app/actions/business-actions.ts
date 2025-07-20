"use server"

import { kv } from "@/lib/redis"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
// Remove direct crypto import
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
import { generateId } from "@/lib/utils"

// Helper function to safely extract error messages
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  if (error && typeof error === "object") {
    return JSON.stringify(error)
  }
  return "Unknown error occurred"
}

// Helper function to safely parse JSON data
function safeJsonParse(data: any, fallback: any = null) {
  try {
    if (typeof data === "string") {
      const parsed = JSON.parse(data)
      return parsed
    }
    if (typeof data === "object" && data !== null) {
      return data
    }
    return fallback
  } catch (error) {
    console.error("Error parsing JSON:", error, "Data:", data)
    return fallback
  }
}

// Helper function to sanitize business data
function sanitizeBusinessData(business: any): Business {
  if (!business || typeof business !== "object") {
    throw new Error("Invalid business data")
  }

  // Check if business is an array (which would cause the .map error)
  if (Array.isArray(business)) {
    console.error("Business data is unexpectedly an array:", business)
    throw new Error("Business data is an array instead of an object")
  }

  // Ensure all required fields exist and are of correct type
  const sanitized: Business = {
    id: business.id || "",
    firstName: business.firstName || "",
    lastName: business.lastName || "",
    businessName: business.businessName || "",
    zipCode: business.zipCode || "",
    email: business.email || "",
    isEmailVerified: Boolean(business.isEmailVerified),
    createdAt: business.createdAt || new Date().toISOString(),
    updatedAt: business.updatedAt || new Date().toISOString(),
  }

  // Add optional fields if they exist
  if (business.passwordHash) {
    sanitized.passwordHash = business.passwordHash
  }
  if (business.category) {
    sanitized.category = business.category
  }
  if (business.phone) {
    sanitized.phone = business.phone
  }
  if (business.address) {
    sanitized.address = business.address
  }

  return sanitized
}

// Get all businesses
export async function getBusinesses(): Promise<Business[]> {
  try {
    console.log("Fetching all businesses")

    // Check if KV environment variables are available
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.warn("KV environment variables are missing. Using mock data for development.")
      // Return mock data for development/preview
      return [
        {
          id: "demo-business-1",
          firstName: "Demo",
          lastName: "User",
          businessName: "Demo Business 1",
          zipCode: "12345",
          email: "demo1@example.com",
          isEmailVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "demo-business-2",
          firstName: "Sample",
          lastName: "Owner",
          businessName: "Sample Business 2",
          zipCode: "67890",
          email: "demo2@example.com",
          isEmailVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
    }

    // Get all business IDs from the set
    let businessIds: string[] = []

    try {
      businessIds = (await kv.smembers(KEY_PREFIXES.BUSINESSES_SET)) as string[]
      console.log(`Found ${businessIds.length} business IDs`)
    } catch (error) {
      console.error("Error fetching business IDs:", getErrorMessage(error))
      return []
    }

    if (!businessIds || businessIds.length === 0) {
      console.log("No business IDs found in the set")
      return []
    }

    // Fetch each business's data with individual error handling
    const businessesPromises = businessIds.map(async (id) => {
      try {
        const business = (await kv.get(`${KEY_PREFIXES.BUSINESS}${id}`)) as Business | null
        if (business && typeof business === "object") {
          return sanitizeBusinessData({ ...business, id })
        }
        console.warn(`Business ${id} not found or invalid data`)
        return null
      } catch (err) {
        console.error(`Error fetching business ${id}:`, getErrorMessage(err))
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
    console.error("Error fetching businesses:", getErrorMessage(error))
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

    return sanitizeBusinessData({ ...business, id })
  } catch (error) {
    console.error(`Error fetching business with ID ${id}:`, getErrorMessage(error))
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
            console.error("Error parsing categories data:", getErrorMessage(e))
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
      console.error(`Error removing business ${id} from category indexes:`, getErrorMessage(error))
    }

    // Get business zip codes and remove from indexes
    try {
      let zipCodes: string[] = []

      // First try to get zip codes as a set (smembers)
      try {
        zipCodes = await kv.smembers(`${KEY_PREFIXES.BUSINESS}${id}:zipcodes`)
      } catch (setError) {
        console.log("Zip codes not stored as a set, trying as a string value:", getErrorMessage(setError))

        // If that fails, try to get it as a string (get)
        try {
          const zipCodesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${id}:zipcodes`)
          if (zipCodesData) {
            if (typeof zipCodesData === "string") {
              try {
                zipCodes = JSON.parse(zipCodesData)
              } catch (parseError) {
                console.error("Error parsing zip codes data:", getErrorMessage(parseError))
                // If it's a string but not JSON, it might be a single zip code
                zipCodes = [zipCodesData]
              }
            } else if (Array.isArray(zipCodesData)) {
              zipCodes = zipCodesData
            }
          }
        } catch (getError) {
          console.error("Error getting zip codes as string:", getErrorMessage(getError))
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
      console.error(`Error removing business ${id} from zip code indexes:`, getErrorMessage(error))
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
    console.error(`Error deleting business with ID ${id}:`, getErrorMessage(error))
    return {
      success: false,
      message: getErrorMessage(error),
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

    // Generate a unique ID for the business using our browser-compatible function
    const id = generateId()

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
    const cookieStore = await cookies()
    cookieStore.set("businessId", id, {
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
    console.error("Business registration failed:", getErrorMessage(error))
    return { success: false, message: "Registration failed. Please try again." }
  }
}

// Login a business - FIXED VERSION
export async function loginBusiness(formData: FormData) {
  try {
    const email = (formData.get("email") as string).toLowerCase()
    const password = formData.get("password") as string
    const rememberMe = formData.get("rememberMe") === "on"

    console.log(`Login attempt for email: ${email}`)

    // Validate form data
    if (!email || !password) {
      return { success: false, message: "Email and password are required" }
    }

    // Check if KV environment variables are available
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.warn("KV environment variables are missing. Using mock login for development.")

      // Mock login for development - check if it's a demo email
      if (email === "demo@example.com" && password === "demo123") {
        const cookieStore = await cookies()
        cookieStore.set("businessId", "demo-business", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7,
          path: "/",
        })

        return {
          success: true,
          message: "Login successful",
          redirectUrl: "/workbench",
        }
      } else {
        return { success: false, message: "Invalid email or password" }
      }
    }

    // Get business ID by email
    let businessId: string | null = null
    try {
      const businessIdResult = await kv.get(`${KEY_PREFIXES.BUSINESS_EMAIL}${email}`)
      console.log(`Business ID lookup result:`, businessIdResult, typeof businessIdResult)

      if (businessIdResult) {
        if (typeof businessIdResult === "string") {
          businessId = businessIdResult
        } else if (typeof businessIdResult === "object" && businessIdResult !== null) {
          // Handle case where Redis returns an object instead of string
          businessId = String(businessIdResult)
        }
      }
    } catch (error) {
      console.error("Error looking up business by email:", getErrorMessage(error))
      return { success: false, message: "Login failed. Please try again." }
    }

    if (!businessId) {
      console.log(`No business found for email: ${email}`)
      return { success: false, message: "Invalid email or password" }
    }

    console.log(`Found business ID: ${businessId}`)

    // Get business by ID with enhanced error handling
    let businessData: any = null
    try {
      businessData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)
      console.log(`Business data type:`, typeof businessData)
      console.log(`Business data is array:`, Array.isArray(businessData))

      // Additional debugging
      if (businessData) {
        console.log(`Business data keys:`, typeof businessData === "object" ? Object.keys(businessData) : "N/A")
      }
    } catch (error) {
      console.error("Error fetching business data:", getErrorMessage(error))
      return { success: false, message: "Login failed. Please try again." }
    }

    if (!businessData) {
      console.log(`No business data found for ID: ${businessId}`)
      return { success: false, message: "Invalid email or password" }
    }

    // Handle different data types that might come from Redis
    let business: any = null

    try {
      if (typeof businessData === "string") {
        try {
          business = JSON.parse(businessData)
          console.log("Parsed business data from string")
        } catch (parseError) {
          console.error("Failed to parse business data string:", getErrorMessage(parseError))
          return { success: false, message: "Login failed. Please try again." }
        }
      } else if (Array.isArray(businessData)) {
        console.error("Business data is unexpectedly an array:", businessData)
        return { success: false, message: "Login failed. Please try again." }
      } else if (businessData && typeof businessData === "object") {
        business = businessData
        console.log("Using business data object directly")
      } else {
        console.error("Business data is unexpected type:", typeof businessData)
        return { success: false, message: "Login failed. Please try again." }
      }

      // Validate that business is a proper object
      if (!business || typeof business !== "object" || Array.isArray(business)) {
        console.error("Business is not a valid object:", typeof business, Array.isArray(business))
        return { success: false, message: "Login failed. Please try again." }
      }

      // Verify password
      const storedPasswordHash = business.passwordHash
      if (!storedPasswordHash || typeof storedPasswordHash !== "string") {
        console.error("No valid password hash found for business")
        return { success: false, message: "Invalid email or password" }
      }

      let isPasswordValid = false
      try {
        isPasswordValid = await bcrypt.compare(password, storedPasswordHash)
      } catch (error) {
        console.error("Error comparing passwords:", getErrorMessage(error))
        return { success: false, message: "Login failed. Please try again." }
      }

      if (!isPasswordValid) {
        console.log("Password verification failed")
        return { success: false, message: "Invalid email or password" }
      }

      // Check if email is verified
      if (!business.isEmailVerified) {
        return { success: false, message: "Please verify your email before logging in" }
      }

      // Set cookie with business ID
      try {
        const cookieStore = await cookies()
        cookieStore.set("businessId", businessId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7, // 30 days if remember me, otherwise 7 days
          path: "/",
        })
      } catch (error) {
        console.error("Error setting cookie:", getErrorMessage(error))
        return { success: false, message: "Login failed. Please try again." }
      }

      console.log(`Business logged in successfully: ${business.businessName || "Unknown"} (${businessId})`)

      // Return success with redirect URL instead of directly redirecting
      return {
        success: true,
        message: "Login successful",
        redirectUrl: "/workbench",
      }
    } catch (error) {
      console.error("Error processing business data:", getErrorMessage(error))
      return { success: false, message: "Login failed. Please try again." }
    }
  } catch (error) {
    console.error("Business login failed:", getErrorMessage(error))
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

    const cookieStore = await cookies()
    const businessId = cookieStore.get("businessId")?.value
    if (!businessId) {
      console.log("No businessId cookie found")
      return null
    }

    console.log(`Fetching business with ID: ${businessId}`)

    let businessData: any = null
    try {
      businessData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)
    } catch (redisError) {
      console.error("Redis error when fetching business:", getErrorMessage(redisError))
      return null
    }

    if (!businessData) {
      console.log(`No business found with ID: ${businessId}`)
      return null
    }

    console.log("Raw business data type:", typeof businessData)
    console.log("Is array:", Array.isArray(businessData))
    console.log(
      "Raw business data keys:",
      businessData && typeof businessData === "object" ? Object.keys(businessData) : "N/A",
    )

    // Handle different data types that might come from Redis
    let processedData: any = null

    if (typeof businessData === "string") {
      try {
        processedData = JSON.parse(businessData)
        console.log("Parsed string data successfully")
      } catch (parseError) {
        console.error("Failed to parse business data string:", getErrorMessage(parseError))
        return null
      }
    } else if (Array.isArray(businessData)) {
      console.error("Business data is unexpectedly an array:", businessData)
      return null
    } else if (businessData && typeof businessData === "object") {
      processedData = businessData
      console.log("Using object data directly")
    } else {
      console.error("Business data is unexpected type:", typeof businessData, businessData)
      return null
    }

    // Validate that processedData is a proper object
    if (!processedData || typeof processedData !== "object" || Array.isArray(processedData)) {
      console.error("Processed data is not a valid object:", typeof processedData, Array.isArray(processedData))
      return null
    }

    // Safely construct the business object with explicit property access
    const business = {
      id: businessId,
      firstName: processedData.firstName && typeof processedData.firstName === "string" ? processedData.firstName : "",
      lastName: processedData.lastName && typeof processedData.lastName === "string" ? processedData.lastName : "",
      businessName:
        processedData.businessName && typeof processedData.businessName === "string" ? processedData.businessName : "",
      zipCode: processedData.zipCode && typeof processedData.zipCode === "string" ? processedData.zipCode : "",
      email: processedData.email && typeof processedData.email === "string" ? processedData.email : "",
      isEmailVerified: Boolean(processedData.isEmailVerified),
      createdAt:
        processedData.createdAt && typeof processedData.createdAt === "string"
          ? processedData.createdAt
          : new Date().toISOString(),
      updatedAt:
        processedData.updatedAt && typeof processedData.updatedAt === "string"
          ? processedData.updatedAt
          : new Date().toISOString(),
    }

    // Add optional fields with type checking
    if (processedData.passwordHash && typeof processedData.passwordHash === "string") {
      business.passwordHash = processedData.passwordHash
    }
    if (processedData.category && typeof processedData.category === "string") {
      business.category = processedData.category
    }
    if (processedData.phone && typeof processedData.phone === "string") {
      business.phone = processedData.phone
    }
    if (processedData.address && typeof processedData.address === "string") {
      business.address = processedData.address
    }

    console.log("Successfully constructed business object:", {
      id: business.id,
      businessName: business.businessName,
      email: business.email,
    })

    return business
  } catch (error) {
    console.error("Error getting current business:", getErrorMessage(error))
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return null
  }
}

// Logout the current business
export async function logoutBusiness() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("businessId")
    return { success: true }
  } catch (error) {
    console.error("Error during logout:", getErrorMessage(error))
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
    console.error("Error checking business email:", getErrorMessage(error))
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

    console.log("Saving business ad design with color data:", {
      designId: designData.designId,
      colorScheme: designData.colorScheme,
      colorValues: designData.colorValues,
      texture: designData.texture,
    })

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
        texture: designData.texture || "gradient", // Add texture with default
        customButton: designData.customButton || { type: "Menu", name: "Menu", icon: "Menu" },
        updatedAt: new Date().toISOString(),
      }),
    )

    // Store the color values separately AND include them in the main data
    if (designData.colorValues) {
      console.log("Saving color values:", designData.colorValues)
      await kv.set(colorsKey, JSON.stringify(designData.colorValues))

      // ALSO save color values in the main design data for easier retrieval
      await kv.set(
        mainKey,
        JSON.stringify({
          designId: designData.designId,
          colorScheme: designData.colorScheme,
          colorValues: designData.colorValues, // Include color values here too
          texture: designData.texture || "gradient",
          customButton: designData.customButton || { type: "Menu", name: "Menu", icon: "Menu" },
          customColors: designData.customColors || null, // Add custom colors
          updatedAt: new Date().toISOString(),
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
    console.error("Error saving business ad design:", getErrorMessage(error))
    return {
      success: false,
      error: getErrorMessage(error),
    }
  }
}

// Update the getBusinessAdDesign function to ensure proper data retrieval and fix the .map error
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
        designData = safeJsonParse(designDataStr, {
          designId: 5,
          colorScheme: "blue",
          texture: "gradient",
          customButton: { type: "Menu", name: "Menu", icon: "Menu" },
        })
        console.log("Parsed design data:", designData)

        // Ensure designData is an object, not an array
        if (Array.isArray(designData)) {
          console.error("Design data is unexpectedly an array, using default object")
          designData = {
            designId: 5,
            colorScheme: "blue",
            texture: "gradient",
            customButton: { type: "Menu", name: "Menu", icon: "Menu" },
          }
        }
      }
    } catch (error) {
      console.error("Error getting main design data:", getErrorMessage(error))
    }

    // Get the color values
    let colorValues = null
    try {
      const colorValuesStr = await kv.get(colorsKey)
      console.log(`Color values (${colorsKey}):`, colorValuesStr)

      if (colorValuesStr) {
        colorValues = safeJsonParse(colorValuesStr, {})
        // Ensure colorValues is an object, not an array
        if (Array.isArray(colorValues)) {
          console.warn("Color values is unexpectedly an array, converting to object")
          colorValues = {}
        }
      }
    } catch (error) {
      console.error("Error getting color values:", getErrorMessage(error))
      colorValues = {} // Ensure we have a fallback object
    }

    // Get the business information
    let businessInfo = null
    try {
      const businessInfoStr = await kv.get(businessInfoKey)
      console.log(`Business info (${businessInfoKey}):`, businessInfoStr)

      if (businessInfoStr) {
        businessInfo = safeJsonParse(businessInfoStr, {})
        // Ensure businessInfo is an object, not an array
        if (Array.isArray(businessInfo)) {
          console.warn("Business info is unexpectedly an array, converting to object")
          businessInfo = {}
        }
      }
    } catch (error) {
      console.error("Error getting business info:", getErrorMessage(error))
    }

    // Get the hidden fields settings
    let hiddenFields = null
    try {
      const hiddenFieldsStr = await kv.get(hiddenFieldsKey)
      console.log(`Hidden fields (${hiddenFieldsKey}):`, hiddenFieldsStr)

      if (hiddenFieldsStr) {
        hiddenFields = safeJsonParse(hiddenFieldsStr, {})
        // Ensure hiddenFields is an object, not an array
        if (Array.isArray(hiddenFields)) {
          console.warn("Hidden fields is unexpectedly an array, converting to object")
          hiddenFields = {}
        }
      }
    } catch (error) {
      console.error("Error getting hidden fields:", getErrorMessage(error))
    }

    // If we don't have any design data, try to get it from the old format
    if (!designData) {
      try {
        // Try to get the data in the old format (as a single object)
        const oldFormatData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:adDesign`)
        console.log("Trying old format data:", oldFormatData)

        if (oldFormatData) {
          const parsedData = safeJsonParse(oldFormatData, {})

          if (parsedData && typeof parsedData === "object" && !Array.isArray(parsedData)) {
            // Extract the components from the old format
            designData = {
              designId: parsedData.designId || 5,
              colorScheme: parsedData.colorScheme || "blue",
              texture: parsedData.texture || "gradient",
              customButton: parsedData.customButton || { type: "Menu", name: "Menu", icon: "Menu" },
              customColors: parsedData.customColors || null,
              updatedAt: parsedData.updatedAt || new Date().toISOString(),
            }

            businessInfo = parsedData.businessInfo || {}
            colorValues = parsedData.colorValues || {}
            hiddenFields = parsedData.hiddenFields || {}

            console.log("Successfully retrieved data from old format")
          }
        }
      } catch (error) {
        console.error("Error getting data from old format:", getErrorMessage(error))
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

    // Ensure all data is objects, not arrays, to prevent .map errors
    const safeDesignData =
      designData && typeof designData === "object" && !Array.isArray(designData)
        ? designData
        : {
            designId: 5,
            colorScheme: "blue",
            texture: "gradient",
            customButton: { type: "Menu", name: "Menu", icon: "Menu" },
          }

    const safeColorValues =
      colorValues && typeof colorValues === "object" && !Array.isArray(colorValues) ? colorValues : {}
    const safeBusinessInfo =
      businessInfo && typeof businessInfo === "object" && !Array.isArray(businessInfo) ? businessInfo : {}
    const safeHiddenFields =
      hiddenFields && typeof hiddenFields === "object" && !Array.isArray(hiddenFields) ? hiddenFields : {}

    // Ensure customButton is included in the returned data
    const result = {
      ...safeDesignData,
      colorValues: safeColorValues,
      businessInfo: { ...defaultBusinessInfo, ...safeBusinessInfo },
      hiddenFields: safeHiddenFields,
      customButton: safeDesignData.customButton || { type: "Menu", name: "Menu", icon: "Menu" },
      texture: safeDesignData.texture || "gradient", // Ensure texture is included with default
      customColors: safeDesignData.customColors || null, // Include custom colors
    }

    console.log("Final combined ad design data with colors:", {
      ...result,
      colorValues: result.colorValues,
      colorScheme: result.colorScheme,
    })
    return result
  } catch (error) {
    console.error("Error getting business ad design:", getErrorMessage(error))
    return null
  }
}

// Add a new function to get businesses with ad design data
export async function getBusinessesWithAdDesignData(): Promise<Business[]> {
  try {
    console.log("Fetching all businesses with ad design data")

    // Check if KV environment variables are available
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.warn("KV environment variables are missing. Using mock data for development.")
      return [
        {
          id: "demo-business-1",
          firstName: "Demo",
          lastName: "User",
          businessName: "Demo Business 1",
          zipCode: "12345",
          email: "demo1@example.com",
          isEmailVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
    }

    // Get all business IDs from the set
    let businessIds: string[] = []

    try {
      businessIds = (await kv.smembers(KEY_PREFIXES.BUSINESSES_SET)) as string[]
      console.log(`Found ${businessIds.length} business IDs`)
    } catch (error) {
      console.error("Error fetching business IDs:", getErrorMessage(error))
      return []
    }

    if (!businessIds || businessIds.length === 0) {
      console.log("No business IDs found in the set")
      return []
    }

    // Fetch each business's data with ad design data
    const businessesPromises = businessIds.map(async (id) => {
      try {
        const business = (await kv.get(`${KEY_PREFIXES.BUSINESS}${id}`)) as Business | null
        if (business && typeof business === "object") {
          const sanitizedBusiness = sanitizeBusinessData({ ...business, id })

          // Get ad design data
          const adDesignData = await getBusinessAdDesign(id)

          // If ad design has a business name, use that instead
          if (adDesignData?.businessInfo?.businessName) {
            sanitizedBusiness.displayName = adDesignData.businessInfo.businessName
          } else {
            sanitizedBusiness.displayName = sanitizedBusiness.businessName
          }

          // Also attach the full ad design data for other uses
          sanitizedBusiness.adDesignData = adDesignData

          return sanitizedBusiness
        }
        console.warn(`Business ${id} not found or invalid data`)
        return null
      } catch (err) {
        console.error(`Error fetching business ${id}:`, getErrorMessage(err))
        return null
      }
    })

    const businesses = (await Promise.all(businessesPromises)).filter(Boolean) as Business[]

    console.log(`Successfully fetched ${businesses.length} businesses with ad design data`)

    // Sort by creation date (newest first)
    return businesses.sort((a, b) => {
      const dateA = new Date(a.createdAt || "").getTime()
      const dateB = new Date(b.createdAt || "").getTime()
      return dateB - dateA
    })
  } catch (error) {
    console.error("Error fetching businesses with ad design data:", getErrorMessage(error))
    return []
  }
}

// Update the existing getBusinessesByCategory function to include ad design data
export async function getBusinessesByCategoryWithAdDesign(category: string): Promise<Business[]> {
  try {
    console.log(`Getting businesses with ad design for category: ${category}`)

    // Get businesses by category using existing function
    const businesses = await getBusinessesByCategoryFromDb(category)

    // Enhance each business with ad design data
    const enhancedBusinesses = await Promise.all(
      businesses.map(async (business) => {
        try {
          // Get ad design data
          const adDesignData = await getBusinessAdDesign(business.id)

          // If ad design has a business name, use that instead
          if (adDesignData?.businessInfo?.businessName) {
            business.displayName = adDesignData.businessInfo.businessName
          } else {
            business.displayName = business.businessName
          }

          // Also attach the full ad design data for other uses
          business.adDesignData = adDesignData

          return business
        } catch (error) {
          console.error(`Error getting ad design for business ${business.id}:`, getErrorMessage(error))
          // Fallback to registration name
          business.displayName = business.businessName
          return business
        }
      }),
    )

    console.log(`Enhanced ${enhancedBusinesses.length} businesses with ad design data for category ${category}`)
    return enhancedBusinesses
  } catch (error) {
    console.error(`Error getting businesses with ad design for category ${category}:`, getErrorMessage(error))
    return []
  }
}

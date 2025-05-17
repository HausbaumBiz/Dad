import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@/lib/redis"
import { KEY_PREFIXES, CATEGORY_MAPPINGS } from "@/lib/db-schema"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get("category")

    if (!category) {
      return NextResponse.json({ error: "Category parameter is required" }, { status: 400 })
    }

    console.log(`API: Fetching businesses for category: ${category}`)

    // Try to normalize the category using mappings
    const normalizedCategory = CATEGORY_MAPPINGS[category.toLowerCase()] || category
    console.log(`API: Normalized category: ${normalizedCategory}`)

    // Special handling for Pet Care category
    const isPetCare = category === "pet-care" || category === "petCare" || category.toLowerCase().includes("pet care")

    // Special handling for Weddings and Special Events category
    const isWeddingsEvents =
      category === "weddings-events" ||
      category === "weddingsEvents" ||
      category.toLowerCase().includes("weddings") ||
      category.toLowerCase().includes("special events")

    // Special handling for Athletics, Fitness & Dance category
    const isAthletics =
      category === "fitness-athletics" ||
      category === "athletics" ||
      category.toLowerCase().includes("athletics") ||
      category.toLowerCase().includes("fitness") ||
      category.toLowerCase().includes("dance")

    // Special handling for Language Lessons/School Subject Tutoring category
    const isLanguageTutoring =
      category === "education-tutoring" ||
      category === "languageTutoring" ||
      category.toLowerCase().includes("language") ||
      category.toLowerCase().includes("tutoring") ||
      category.toLowerCase().includes("education")

    // Special handling for Music category
    const isMusic =
      category === "music-lessons" ||
      category === "music" ||
      category.toLowerCase().includes("music") ||
      category.toLowerCase().includes("instrument") ||
      category.toLowerCase().includes("lessons")

    // Special handling for Real Estate category
    const isRealEstate =
      category === "real-estate" ||
      category === "realestate" ||
      category.toLowerCase().includes("real estate") ||
      category.toLowerCase().includes("home buying") ||
      category.toLowerCase().includes("home selling")

    // Get business IDs for the original category
    let businessIds = []
    try {
      businessIds = await kv.smembers(`${KEY_PREFIXES.CATEGORY}${category}`)
      console.log(`API: Found ${businessIds.length} businesses for exact category: ${category}`)
    } catch (error) {
      console.error(`API: Error fetching businesses for exact category ${category}:`, error)
    }

    // Also try with the normalized category
    if (normalizedCategory !== category) {
      try {
        const normalizedBusinessIds = await kv.smembers(`${KEY_PREFIXES.CATEGORY}${normalizedCategory}`)
        console.log(
          `API: Found ${normalizedBusinessIds.length} businesses for normalized category: ${normalizedCategory}`,
        )
        businessIds = [...businessIds, ...normalizedBusinessIds]
      } catch (error) {
        console.error(`API: Error fetching businesses for normalized category ${normalizedCategory}:`, error)
      }
    }

    // Also try with :businesses suffix for both formats
    try {
      const businessIdsWithSuffix = await kv.smembers(`${KEY_PREFIXES.CATEGORY}${category}:businesses`)
      console.log(
        `API: Found ${businessIdsWithSuffix.length} businesses for category with suffix: ${category}:businesses`,
      )
      businessIds = [...businessIds, ...businessIdsWithSuffix]
    } catch (error) {
      console.error(`API: Error fetching businesses for category with suffix ${category}:businesses:`, error)
    }

    if (normalizedCategory !== category) {
      try {
        const normalizedBusinessIdsWithSuffix = await kv.smembers(
          `${KEY_PREFIXES.CATEGORY}${normalizedCategory}:businesses`,
        )
        console.log(
          `API: Found ${normalizedBusinessIdsWithSuffix.length} businesses for normalized category with suffix: ${normalizedCategory}:businesses`,
        )
        businessIds = [...businessIds, ...normalizedBusinessIdsWithSuffix]
      } catch (error) {
        console.error(
          `API: Error fetching businesses for normalized category with suffix ${normalizedCategory}:businesses:`,
          error,
        )
      }
    }

    // Special handling for Automotive/Motorcycle/RV, etc format
    if (
      category.includes("automotive") ||
      category.includes("Automotive") ||
      normalizedCategory === "Automotive Services"
    ) {
      try {
        // Try the exact format with ", etc"
        const etcFormat = "Automotive/Motorcycle/RV, etc"
        const etcBusinessIds = await kv.smembers(`${KEY_PREFIXES.CATEGORY}${etcFormat}`)
        console.log(`API: Found ${etcBusinessIds.length} businesses for etc format: ${etcFormat}`)
        businessIds = [...businessIds, ...etcBusinessIds]

        // Also try with :businesses suffix
        const etcBusinessIdsWithSuffix = await kv.smembers(`${KEY_PREFIXES.CATEGORY}${etcFormat}:businesses`)
        console.log(
          `API: Found ${etcBusinessIdsWithSuffix.length} businesses for etc format with suffix: ${etcFormat}:businesses`,
        )
        businessIds = [...businessIds, ...etcBusinessIdsWithSuffix]
      } catch (error) {
        console.error(`API: Error fetching businesses for etc format:`, error)
      }
    }

    // Special handling for categories - check for businesses with relevant subcategories
    if (isPetCare || isWeddingsEvents || isAthletics || isLanguageTutoring || isMusic || isRealEstate) {
      try {
        // Get all businesses
        const allBusinessIds = await kv.smembers(KEY_PREFIXES.BUSINESSES_SET)

        // For each business, check if they have the relevant category in their categories or subcategories
        for (const id of allBusinessIds) {
          try {
            // Get business data
            const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${id}`)

            if (business) {
              if (isPetCare) {
                // Check if business has Pet Care in categories or subcategories
                const hasPetCare =
                  business.category === "Pet Care" ||
                  (business.allCategories &&
                    business.allCategories.some(
                      (cat: string) => cat === "Pet Care" || cat.toLowerCase().includes("pet care"),
                    )) ||
                  (business.allSubcategories &&
                    business.allSubcategories.some((sub: string) =>
                      petCareFilterOptions.some((option) => option.value.toLowerCase() === sub.toLowerCase()),
                    ))

                if (hasPetCare && !businessIds.includes(id)) {
                  businessIds.push(id)
                }
              }

              if (isWeddingsEvents) {
                // Check if business has Weddings and Special Events in categories or subcategories
                const hasWeddingsEvents =
                  business.category === "Weddings and Special Events" ||
                  (business.allCategories &&
                    business.allCategories.some(
                      (cat: string) =>
                        cat === "Weddings and Special Events" ||
                        cat.toLowerCase().includes("weddings") ||
                        cat.toLowerCase().includes("special events"),
                    )) ||
                  (business.allSubcategories &&
                    business.allSubcategories.some((sub: string) =>
                      weddingsEventsFilterOptions.some((option) => option.value.toLowerCase() === sub.toLowerCase()),
                    ))

                if (hasWeddingsEvents && !businessIds.includes(id)) {
                  businessIds.push(id)
                }
              }

              if (isAthletics) {
                // Check if business has Athletics in categories or subcategories
                const hasAthletics =
                  business.category === "Athletics, Fitness & Dance Instruction" ||
                  (business.allCategories &&
                    business.allCategories.some(
                      (cat: string) =>
                        cat === "Athletics, Fitness & Dance Instruction" ||
                        cat.toLowerCase().includes("athletics") ||
                        cat.toLowerCase().includes("fitness") ||
                        cat.toLowerCase().includes("dance"),
                    )) ||
                  (business.allSubcategories &&
                    business.allSubcategories.some((sub: string) =>
                      athleticsFilterOptions.some((option) => option.value.toLowerCase() === sub.toLowerCase()),
                    ))

                if (hasAthletics && !businessIds.includes(id)) {
                  businessIds.push(id)
                }
              }

              if (isLanguageTutoring) {
                // Check if business has Language Lessons/School Subject Tutoring in categories or subcategories
                const hasLanguageTutoring =
                  business.category === "Language Lessons & School Subject Tutoring" ||
                  (business.allCategories &&
                    business.allCategories.some(
                      (cat: string) =>
                        cat === "Language Lessons & School Subject Tutoring" ||
                        cat.toLowerCase().includes("language") ||
                        cat.toLowerCase().includes("tutoring") ||
                        cat.toLowerCase().includes("education"),
                    )) ||
                  (business.allSubcategories &&
                    business.allSubcategories.some((sub: string) =>
                      languageTutoringFilterOptions.some((option) => option.value.toLowerCase() === sub.toLowerCase()),
                    ))

                if (hasLanguageTutoring && !businessIds.includes(id)) {
                  businessIds.push(id)
                }
              }

              if (isMusic) {
                // Check if business has Music in categories or subcategories
                const hasMusic =
                  business.category === "Music" ||
                  (business.allCategories &&
                    business.allCategories.some(
                      (cat: string) =>
                        cat === "Music" ||
                        cat.toLowerCase().includes("music") ||
                        cat.toLowerCase().includes("instrument") ||
                        cat.toLowerCase().includes("lessons"),
                    )) ||
                  (business.allSubcategories &&
                    business.allSubcategories.some((sub: string) =>
                      musicFilterOptions.some((option) => option.value.toLowerCase() === sub.toLowerCase()),
                    ))

                if (hasMusic && !businessIds.includes(id)) {
                  businessIds.push(id)
                }
              }

              if (isRealEstate) {
                // Check if business has Real Estate in categories or subcategories
                const hasRealEstate =
                  business.category === "Home Buying and Selling" ||
                  (business.allCategories &&
                    business.allCategories.some(
                      (cat: string) =>
                        cat === "Home Buying and Selling" ||
                        cat.toLowerCase().includes("real estate") ||
                        cat.toLowerCase().includes("home buying") ||
                        cat.toLowerCase().includes("home selling"),
                    )) ||
                  (business.allSubcategories &&
                    business.allSubcategories.some((sub: string) =>
                      realEstateFilterOptions.some((option) => option.value.toLowerCase() === sub.toLowerCase()),
                    ))

                if (hasRealEstate && !businessIds.includes(id)) {
                  businessIds.push(id)
                }
              }
            }
          } catch (error) {
            console.error(`API: Error checking business ${id} for category:`, error)
          }
        }
      } catch (error) {
        console.error(`API: Error fetching all businesses for category check:`, error)
      }
    }

    // Remove duplicates
    const uniqueBusinessIds = [...new Set(businessIds)]
    console.log(`API: Total unique business IDs: ${uniqueBusinessIds.length}`)

    if (!uniqueBusinessIds || uniqueBusinessIds.length === 0) {
      return NextResponse.json({ businesses: [] })
    }

    // Fetch each business's data
    const businessesPromises = uniqueBusinessIds.map(async (id) => {
      try {
        const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${id}`)
        return business ? { ...business, id } : null
      } catch (err) {
        console.error(`API: Error fetching business ${id}:`, err)
        return null
      }
    })

    const allBusinesses = (await Promise.all(businessesPromises)).filter(Boolean)

    // Extra validation: filter out businesses that clearly don't belong to this category
    const businesses = allBusinesses.filter((business) => {
      // For Elder Care category, filter out businesses that are clearly Legal Services
      if (
        (category === "elder-care" || category === "homecare") &&
        (business.category === "Lawyers" ||
          business.category === "Legal Services" ||
          (business.allCategories &&
            business.allCategories.some(
              (cat) =>
                cat === "Lawyers" ||
                cat === "Legal Services" ||
                cat.toLowerCase().includes("lawyer") ||
                cat.toLowerCase().includes("legal"),
            )))
      ) {
        console.log(`API: Filtered out legal business ${business.id} from elder care results`)
        return false
      }

      // For Legal Services category, filter out businesses that are clearly Elder Care
      if (
        (category === "legal-services" || category === "lawyers") &&
        (business.category === "Elder Care" ||
          business.category === "Homecare" ||
          (business.allCategories &&
            business.allCategories.some(
              (cat) =>
                cat === "Elder Care" ||
                cat === "Homecare" ||
                cat.toLowerCase().includes("elder") ||
                cat.toLowerCase().includes("care"),
            ))) &&
        !business.allSubcategories?.some(
          (sub) =>
            sub.toLowerCase().includes("lawyer") ||
            sub.toLowerCase().includes("legal") ||
            sub.toLowerCase().includes("attorney"),
        )
      ) {
        console.log(`API: Filtered out elder care business ${business.id} from legal results`)
        return false
      }

      // For Pet Care category, ensure it has relevant subcategories
      if (isPetCare) {
        // If it explicitly has Pet Care category, include it
        if (
          business.category === "Pet Care" ||
          (business.allCategories &&
            business.allCategories.some((cat) => cat === "Pet Care" || cat.toLowerCase().includes("pet care")))
        ) {
          return true
        }

        // Check if it has any Pet Care related subcategories
        return (
          business.allSubcategories &&
          business.allSubcategories.some((sub) =>
            petCareFilterOptions.some((option) => option.value.toLowerCase() === sub.toLowerCase()),
          )
        )
      }

      // For Weddings and Special Events category, ensure it has relevant subcategories
      if (isWeddingsEvents) {
        // If it explicitly has Weddings and Special Events category, include it
        if (
          business.category === "Weddings and Special Events" ||
          (business.allCategories &&
            business.allCategories.some(
              (cat) =>
                cat === "Weddings and Special Events" ||
                cat.toLowerCase().includes("weddings") ||
                cat.toLowerCase().includes("special events"),
            ))
        ) {
          return true
        }

        // Check if it has any Weddings and Special Events related subcategories
        return (
          business.allSubcategories &&
          business.allSubcategories.some((sub) =>
            weddingsEventsFilterOptions.some((option) => option.value.toLowerCase() === sub.toLowerCase()),
          )
        )
      }

      // For Athletics category, ensure it has relevant subcategories
      if (isAthletics) {
        // If it explicitly has Athletics category, include it
        if (
          business.category === "Athletics, Fitness & Dance Instruction" ||
          (business.allCategories &&
            business.allCategories.some(
              (cat) =>
                cat === "Athletics, Fitness & Dance Instruction" ||
                cat.toLowerCase().includes("athletics") ||
                cat.toLowerCase().includes("fitness") ||
                cat.toLowerCase().includes("dance"),
            ))
        ) {
          return true
        }

        // Check if it has any Athletics related subcategories
        return (
          business.allSubcategories &&
          business.allSubcategories.some((sub) =>
            athleticsFilterOptions.some((option) => option.value.toLowerCase() === sub.toLowerCase()),
          )
        )
      }

      // For Language Lessons/School Subject Tutoring category, ensure it has relevant subcategories
      if (isLanguageTutoring) {
        // If it explicitly has Language Lessons/School Subject Tutoring category, include it
        if (
          business.category === "Language Lessons & School Subject Tutoring" ||
          (business.allCategories &&
            business.allCategories.some(
              (cat) =>
                cat === "Language Lessons & School Subject Tutoring" ||
                cat.toLowerCase().includes("language") ||
                cat.toLowerCase().includes("tutoring") ||
                cat.toLowerCase().includes("education"),
            ))
        ) {
          return true
        }

        // Check if it has any Language Lessons/School Subject Tutoring related subcategories
        return (
          business.allSubcategories &&
          business.allSubcategories.some((sub) =>
            languageTutoringFilterOptions.some((option) => option.value.toLowerCase() === sub.toLowerCase()),
          )
        )
      }

      // For Music category, ensure it has relevant subcategories
      if (isMusic) {
        // If it explicitly has Music category, include it
        if (
          business.category === "Music" ||
          (business.allCategories &&
            business.allCategories.some(
              (cat) =>
                cat === "Music" ||
                cat.toLowerCase().includes("music") ||
                cat.toLowerCase().includes("instrument") ||
                cat.toLowerCase().includes("lessons"),
            ))
        ) {
          return true
        }

        // Check if it has any Music related subcategories
        return (
          business.allSubcategories &&
          business.allSubcategories.some((sub) =>
            musicFilterOptions.some((option) => option.value.toLowerCase() === sub.toLowerCase()),
          )
        )
      }

      // For Real Estate category, ensure it has relevant subcategories
      if (isRealEstate) {
        // If it explicitly has Real Estate category, include it
        if (
          business.category === "Home Buying and Selling" ||
          (business.allCategories &&
            business.allCategories.some(
              (cat) =>
                cat === "Home Buying and Selling" ||
                cat.toLowerCase().includes("real estate") ||
                cat.toLowerCase().includes("home buying") ||
                cat.toLowerCase().includes("home selling"),
            ))
        ) {
          return true
        }

        // Check if it has any Real Estate related subcategories
        return (
          business.allSubcategories &&
          business.allSubcategories.some((sub) =>
            realEstateFilterOptions.some((option) => option.value.toLowerCase() === sub.toLowerCase()),
          )
        )
      }

      return true
    })

    console.log(
      `API: Successfully fetched ${businesses.length} businesses for category ${category} (filtered from ${allBusinesses.length})`,
    )

    return NextResponse.json({ businesses })
  } catch (error) {
    console.error("API: Error fetching businesses by category:", error)
    return NextResponse.json({ error: "Failed to fetch businesses" }, { status: 500 })
  }
}

// Pet Care filter options for reference in the API
const petCareFilterOptions = [
  { id: "pet1", label: "Veterinarians", value: "Veterinarians" },
  { id: "pet2", label: "Pet Hospitals", value: "Pet Hospitals" },
  { id: "pet3", label: "Dog Fencing/Invisible Fence", value: "Dog Fencing/Invisible Fence" },
  { id: "pet4", label: "Pet Groomers", value: "Pet Groomers" },
  { id: "pet5", label: "Pet Trainers", value: "Pet Trainers" },
  { id: "pet6", label: "Pet Walkers", value: "Pet Walkers" },
  { id: "pet7", label: "Pet Sitters", value: "Pet Sitters" },
  { id: "pet8", label: "Pet Boarders", value: "Pet Boarders" },
  { id: "pet9", label: "Pet Breeders", value: "Pet Breeders" },
  { id: "pet10", label: "Pet Shops", value: "Pet Shops" },
  { id: "pet11", label: "Pet Rescues", value: "Pet Rescues" },
  { id: "pet12", label: "Aquariums/Pet Enclosures", value: "Aquariums/Pet Enclosures" },
  { id: "pet13", label: "Pet Poop Pickup", value: "Pet Poop Pickup" },
  { id: "pet14", label: "Other Pet Care", value: "Other Pet Care" },
]

// Weddings and Special Events filter options for reference in the API
const weddingsEventsFilterOptions = [
  { id: "weddings1", label: "Event Halls", value: "Event Halls" },
  { id: "weddings2", label: "Tent and Chair Rentals", value: "Tent and Chair Rentals" },
  { id: "weddings3", label: "Wedding Planners", value: "Wedding Planners" },
  { id: "weddings4", label: "Food Caterers", value: "Food Caterers" },
  { id: "weddings5", label: "Bartenders", value: "Bartenders" },
  { id: "weddings6", label: "Live Music Entertainment", value: "Live Music Entertainment" },
  { id: "weddings7", label: "DJs", value: "DJs" },
  { id: "weddings8", label: "Performers", value: "Performers" },
  { id: "weddings9", label: "Tuxedo Rentals", value: "Tuxedo Rentals" },
  { id: "weddings10", label: "Limousine Services", value: "Limousine Services" },
  { id: "weddings11", label: "Tailors and Seamstresses", value: "Tailors and Seamstresses" },
  { id: "weddings12", label: "Wedding Dresses", value: "Wedding Dresses" },
  { id: "weddings13", label: "Wedding Photographers", value: "Wedding Photographers" },
  { id: "weddings14", label: "Florists", value: "Florists" },
  { id: "weddings15", label: "Wedding Cakes", value: "Wedding Cakes" },
  { id: "weddings16", label: "Marriage Officiants", value: "Marriage Officiants" },
  { id: "weddings17", label: "Other Weddings and Special Events", value: "Other Weddings and Special Events" },
]

// Athletics filter options for reference in the API
const athleticsFilterOptions = [
  { id: "athletics1", label: "Baseball/Softball", value: "Baseball/Softball" },
  { id: "athletics2", label: "Golf", value: "Golf" },
  { id: "athletics3", label: "Tennis", value: "Tennis" },
  { id: "athletics4", label: "Basketball", value: "Basketball" },
  { id: "athletics5", label: "Football", value: "Football" },
  { id: "athletics6", label: "Soccer", value: "Soccer" },
  { id: "athletics7", label: "Ice Skating", value: "Ice Skating" },
  { id: "athletics8", label: "Gymnastics", value: "Gymnastics" },
  { id: "athletics9", label: "Pickleball", value: "Pickleball" },
  { id: "athletics10", label: "Table Tennis", value: "Table Tennis" },
  { id: "athletics11", label: "Dance", value: "Dance" },
  { id: "athletics12", label: "Personal Trainers", value: "Personal Trainers" },
  { id: "athletics13", label: "Group Fitness Classes", value: "Group Fitness Classes" },
  { id: "athletics14", label: "Other Athletics & Fitness", value: "Other Athletics & Fitness" },
]

// Language Lessons/School Subject Tutoring filter options for reference in the API
const languageTutoringFilterOptions = [
  { id: "language1", label: "Spanish", value: "Spanish" },
  { id: "language2", label: "French", value: "French" },
  { id: "language3", label: "Chinese", value: "Chinese" },
  { id: "language4", label: "American Sign Language", value: "American Sign Language" },
  { id: "language5", label: "English as a Second Language", value: "English as a Second Language" },
  { id: "language6", label: "Other Language", value: "Other Language" },
  { id: "language7", label: "Math - Elementary", value: "Math - Elementary" },
  { id: "language8", label: "Math - High School", value: "Math - High School" },
  { id: "language9", label: "Reading Tutors (Adult and Children)", value: "Reading Tutors (Adult and Children)" },
  { id: "language10", label: "Test Prep", value: "Test Prep" },
  { id: "language11", label: "Other Subjects", value: "Other Subjects" },
]

// Music filter options for reference in the API
const musicFilterOptions = [
  { id: "music1", label: "Piano Lessons", value: "Piano Lessons" },
  { id: "music2", label: "Guitar Lessons", value: "Guitar Lessons" },
  { id: "music3", label: "Violin Lessons", value: "Violin Lessons" },
  { id: "music4", label: "Cello Lessons", value: "Cello Lessons" },
  { id: "music5", label: "Trumpet Lessons", value: "Trumpet Lessons" },
  { id: "music6", label: "Other Instrument Lessons", value: "Other Instrument Lessons" },
  { id: "music7", label: "Instrument Repair", value: "Instrument Repair" },
  { id: "music8", label: "Used and New Instruments for Sale", value: "Used and New Instruments for Sale" },
  { id: "music9", label: "Other Music", value: "Other Music" },
]

// Real Estate filter options for reference in the API
const realEstateFilterOptions = [
  { id: "home1", label: "Real Estate Agent", value: "Real Estate Agent" },
  { id: "home2", label: "Real Estate Appraising", value: "Real Estate Appraising" },
  { id: "home3", label: "Home Staging", value: "Home Staging" },
  { id: "home4", label: "Home Inspection", value: "Home Inspection" },
  { id: "home5", label: "Home Energy Audit", value: "Home Energy Audit" },
  { id: "home6", label: "Other Home Buying and Selling", value: "Other Home Buying and Selling" },
]

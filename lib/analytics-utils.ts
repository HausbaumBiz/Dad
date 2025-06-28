// Client-side analytics tracking utilities

const trackingQueue: Array<{ businessId: string; eventType: string; zipCode?: string; metadata?: any }> = []
let isProcessing = false

async function processTrackingQueue() {
  if (isProcessing || trackingQueue.length === 0) return

  isProcessing = true

  while (trackingQueue.length > 0) {
    const event = trackingQueue.shift()
    if (!event) continue

    try {
      console.log("📡 Sending analytics event:", event)

      const response = await fetch("/api/analytics/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Failed to track analytics event:", errorText)
      } else {
        const result = await response.json()
        console.log("✅ Analytics tracked successfully:", result)
        console.log(
          `📊 Analytics tracked: ${event.eventType} for business ${event.businessId}${event.zipCode ? ` from zip ${event.zipCode}` : ""}`,
        )
      }
    } catch (error) {
      console.error("❌ Error tracking analytics:", error)
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  isProcessing = false
}

function queueTrackingEvent(businessId: string, eventType: string, zipCode?: string, metadata?: any) {
  console.log("📋 Queueing tracking event:", { businessId, eventType, zipCode, metadata })
  trackingQueue.push({ businessId, eventType, zipCode, metadata })
  processTrackingQueue()
}

// Debounced tracking functions to prevent spam
const trackingDebounce: Record<string, number> = {}

function createDebouncedTracker(eventType: string) {
  return (businessId: string, zipCode?: string, metadata?: any) => {
    const key = `${businessId}:${eventType}`
    const now = Date.now()

    // Debounce: only track if last event was more than 1 second ago
    if (trackingDebounce[key] && now - trackingDebounce[key] < 1000) {
      console.log("⏱️ Debounced tracking event:", { businessId, eventType, zipCode })
      return
    }

    trackingDebounce[key] = now
    queueTrackingEvent(businessId, eventType, zipCode, metadata)
  }
}

export const trackProfileView = createDebouncedTracker("profile_view")
export const trackPhotoAlbumClick = createDebouncedTracker("photo_album_click")
export const trackCouponClick = createDebouncedTracker("coupon_click")
export const trackJobClick = createDebouncedTracker("job_click")
export const trackPhoneClick = createDebouncedTracker("phone_click")
export const trackWebsiteClick = createDebouncedTracker("website_click")

// Helper function to get current zip code from various sources
export function getCurrentZipCode(): string | undefined {
  console.log("🔍 Attempting to get current ZIP code...")

  if (typeof window === "undefined") {
    console.log("❌ Window not available (server-side)")
    return undefined
  }

  // Try to get zip code from URL parameters first (most reliable)
  const urlParams = new URLSearchParams(window.location.search)
  const zipFromUrl = urlParams.get("zip") || urlParams.get("zipcode") || urlParams.get("location")
  if (zipFromUrl && isValidZipCode(zipFromUrl)) {
    console.log("🔗 Found valid zip code from URL:", zipFromUrl)
    return zipFromUrl
  }

  // Try to get from current page context (if we're on a location-specific page)
  const pathZip = extractZipFromPath(window.location.pathname)
  if (pathZip && isValidZipCode(pathZip)) {
    console.log("🛣️ Found valid zip code from path:", pathZip)
    return pathZip
  }

  // Try to get from localStorage (recent searches)
  const storageKeys = ["currentSearchZip", "userZipCode", "searchZipCode", "selectedZipCode"]
  for (const key of storageKeys) {
    try {
      const savedZip = localStorage.getItem(key)
      if (savedZip && isValidZipCode(savedZip)) {
        console.log(`💾 Found valid zip code from localStorage[${key}]:`, savedZip)
        return savedZip
      }
    } catch (error) {
      console.warn(`Failed to read localStorage[${key}]:`, error)
    }
  }

  // Try to get from session storage
  try {
    const sessionZip = sessionStorage.getItem("currentZipCode")
    if (sessionZip && isValidZipCode(sessionZip)) {
      console.log("🗂️ Found valid zip code from sessionStorage:", sessionZip)
      return sessionZip
    }
  } catch (error) {
    console.warn("Failed to read sessionStorage:", error)
  }

  console.log("❓ No valid zip code found from any source")
  return undefined
}

// Helper function to validate ZIP codes
function isValidZipCode(zip: string): boolean {
  if (!zip || typeof zip !== "string") return false

  // Remove any whitespace
  zip = zip.trim()

  // Check for 5-digit ZIP code
  if (/^\d{5}$/.test(zip)) return true

  // Check for ZIP+4 format
  if (/^\d{5}-\d{4}$/.test(zip)) return true

  return false
}

// Helper function to extract ZIP code from URL path
function extractZipFromPath(pathname: string): string | undefined {
  // Look for patterns like /location/12345 or /zip/12345 or /area/12345
  const zipPatterns = [
    /\/location\/(\d{5})/,
    /\/zip\/(\d{5})/,
    /\/area\/(\d{5})/,
    /\/(\d{5})\/?$/, // ZIP at end of path
  ]

  for (const pattern of zipPatterns) {
    const match = pathname.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return undefined
}

// Function to set the current ZIP code (to be called when user selects/searches for a location)
export function setCurrentZipCode(zipCode: string): void {
  if (!isValidZipCode(zipCode)) {
    console.warn("⚠️ Attempted to set invalid ZIP code:", zipCode)
    return
  }

  console.log("📍 Setting current ZIP code:", zipCode)

  try {
    localStorage.setItem("currentSearchZip", zipCode)
    sessionStorage.setItem("currentZipCode", zipCode)
  } catch (error) {
    console.warn("Failed to save ZIP code to storage:", error)
  }
}

// Function to clear stored ZIP codes (useful for testing)
export function clearStoredZipCodes(): void {
  console.log("🧹 Clearing stored ZIP codes")

  const keysToRemove = ["currentSearchZip", "userZipCode", "searchZipCode", "selectedZipCode"]

  keysToRemove.forEach((key) => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn(`Failed to remove localStorage[${key}]:`, error)
    }
  })

  try {
    sessionStorage.removeItem("currentZipCode")
  } catch (error) {
    console.warn("Failed to remove sessionStorage currentZipCode:", error)
  }
}

// Test function to simulate analytics events with specific ZIP codes
export async function simulateAnalyticsEvent(
  businessId: string,
  eventType: string,
  zipCode?: string,
  metadata?: Record<string, any>,
) {
  try {
    // If no ZIP code provided, try to get current one
    const finalZipCode = zipCode || getCurrentZipCode()

    console.log("🧪 Simulating analytics event:", {
      businessId,
      eventType,
      zipCode: finalZipCode,
      metadata,
    })

    const response = await fetch("/api/analytics/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        businessId,
        eventType,
        zipCode: finalZipCode,
        metadata: {
          ...metadata,
          testMode: true,
          timestamp: Date.now(),
          source: zipCode ? "provided" : "detected",
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log("🧪 Test analytics event result:", result)
    return result
  } catch (error) {
    console.error("❌ Error simulating analytics event:", error)
    throw error
  }
}

// Enhanced tracking function that includes better ZIP code detection
export function trackBusinessInteraction(
  businessId: string,
  eventType: string,
  options?: {
    zipCode?: string
    metadata?: Record<string, any>
    forceZipCode?: boolean // If true, don't track without a ZIP code
  },
) {
  const { zipCode: providedZip, metadata, forceZipCode = false } = options || {}

  // Get ZIP code from provided value or detect current one
  const finalZipCode = providedZip || getCurrentZipCode()

  if (forceZipCode && !finalZipCode) {
    console.warn("⚠️ Skipping analytics tracking - no ZIP code available and forceZipCode is true")
    return
  }

  console.log("📊 Tracking business interaction:", {
    businessId,
    eventType,
    zipCode: finalZipCode,
    metadata,
  })

  // Use the appropriate tracking function
  switch (eventType) {
    case "profile_view":
      trackProfileView(businessId, finalZipCode, metadata)
      break
    case "phone_click":
      trackPhoneClick(businessId, finalZipCode, metadata)
      break
    case "website_click":
      trackWebsiteClick(businessId, finalZipCode, metadata)
      break
    case "coupon_click":
      trackCouponClick(businessId, finalZipCode, metadata)
      break
    case "job_click":
      trackJobClick(businessId, finalZipCode, metadata)
      break
    case "photo_album_click":
      trackPhotoAlbumClick(businessId, finalZipCode, metadata)
      break
    default:
      console.warn("⚠️ Unknown event type:", eventType)
  }
}

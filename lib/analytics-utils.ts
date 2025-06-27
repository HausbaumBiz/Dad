// Client-side analytics tracking utilities

const trackingQueue: Array<{ businessId: string; eventType: string }> = []
let isProcessing = false

async function processTrackingQueue() {
  if (isProcessing || trackingQueue.length === 0) return

  isProcessing = true

  while (trackingQueue.length > 0) {
    const event = trackingQueue.shift()
    if (!event) continue

    try {
      const response = await fetch("/api/analytics/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      })

      if (!response.ok) {
        console.error("Failed to track analytics event:", await response.text())
      } else {
        console.log(`Analytics tracked: ${event.eventType} for business ${event.businessId}`)
      }
    } catch (error) {
      console.error("Error tracking analytics:", error)
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  isProcessing = false
}

function queueTrackingEvent(businessId: string, eventType: string) {
  trackingQueue.push({ businessId, eventType })
  processTrackingQueue()
}

// Debounced tracking functions to prevent spam
const trackingDebounce: Record<string, number> = {}

function createDebouncedTracker(eventType: string) {
  return (businessId: string) => {
    const key = `${businessId}:${eventType}`
    const now = Date.now()

    // Debounce: only track if last event was more than 1 second ago
    if (trackingDebounce[key] && now - trackingDebounce[key] < 1000) {
      return
    }

    trackingDebounce[key] = now
    queueTrackingEvent(businessId, eventType)
  }
}

export const trackProfileView = createDebouncedTracker("profile_view")
export const trackPhotoAlbumClick = createDebouncedTracker("photo_album_click")
export const trackCouponClick = createDebouncedTracker("coupon_click")
export const trackJobClick = createDebouncedTracker("job_click")
export const trackPhoneClick = createDebouncedTracker("phone_click")
export const trackWebsiteClick = createDebouncedTracker("website_click")

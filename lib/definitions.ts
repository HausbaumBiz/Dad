export interface Business {
  id: string
  firstName: string
  lastName: string
  businessName: string
  displayName?: string // Business name from ad design
  displayCity?: string // City from ad design or registration
  displayState?: string // State from ad design or registration
  displayPhone?: string // Phone from ad design or registration
  displayLocation?: string // Combined city, state display
  zipCode: string
  email: string
  passwordHash?: string
  isEmailVerified: boolean
  createdAt: string
  updatedAt: string
  category?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  rating?: number
  reviews?: number
  services?: string[]
  subcategories?: string[]
  allSubcategories?: string[]
  reviewsData?: any[]
  adDesignData?: any // Full ad design data
}

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  passwordHash?: string
  isEmailVerified?: boolean
  createdAt?: string
  updatedAt?: string
  role?: string
}

export interface ZipCode {
  zip: string
  city: string
  state: string
  latitude: number
  longitude: number
  timezone: number
  dst: number
}

export interface ZipCodeDistance {
  zip: string
  distance: number
  city: string
  state: string
}

export interface ZipCodeStats {
  total: number
  byState: Record<string, number>
}

export interface MediaItem {
  id: string
  url: string
  thumbnailUrl?: string
  type: "image" | "video"
  name: string
  size: number
  width?: number
  height?: number
  format?: string
  duration?: number
  createdAt: string
  updatedAt?: string
  tags?: string[]
  folder?: string
  businessId?: string
  metadata?: Record<string, any>
}

export interface CloudflareStreamVideo {
  uid: string
  thumbnail: string
  playback: {
    hls: string
    dash: string
  }
  status: {
    state: string
    pctComplete?: number
    errorReasonCode?: string
    errorReasonText?: string
  }
  meta?: {
    name?: string
  }
  created: string
  modified: string
  size?: number
  preview?: string
  readyToStream?: boolean
  requireSignedURLs?: boolean
  uploaded?: string
  uploadExpiry?: string
  maxSizeBytes?: number
  maxDurationSeconds?: number
  duration?: number
  input?: {
    width?: number
    height?: number
  }
  playbackURL?: string
  thumbnailURL?: string
}

export interface JobListing {
  id: string
  businessId: string
  createdAt: string
  updatedAt: string
  expiresAt: string // Add expiration date
  isExpired: boolean // Add expiration status

  // Basic job details
  jobTitle: string
  jobDescription: string
  qualifications: string
  businessName: string
  businessDescription: string
  businessAddress: string
  workHours: string
  contactEmail: string
  contactName: string

  // Pay details
  payType: "hourly" | "salary" | "other" | null
  hourlyMin?: string
  hourlyMax?: string
  salaryMin?: string
  salaryMax?: string
  otherPay?: string

  // Logo
  logoUrl?: string
  logoId?: string // Add this field

  // Categories
  categories: string[]

  // Benefits
  benefits: Record<string, JobBenefit>
}

export interface JobBenefit {
  label: string
  value: boolean
}

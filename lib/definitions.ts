// Business and category type definitions
export interface Business {
  id: string
  businessName: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  category?: string
  subcategory?: string
  allCategories?: string[]
  allSubcategories?: string[]
  services?: string[]
  description?: string
  website?: string
  isNationwide?: boolean
  serviceRadius?: number
  createdAt?: string
  updatedAt?: string
  categoriesCount?: number
}

export interface CategorySelection {
  category: string
  subcategory: string
  fullPath: string
}

export interface CategoryData {
  id: string
  name: string
  parentId?: string
  path: string
}

export interface ServiceAreaData {
  zipCodes: string[]
  isNationwide: boolean
  radius?: number
  centralZip?: string
}

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  createdAt?: string
  updatedAt?: string
}

export interface Job {
  id: string
  businessId: string
  title: string
  description: string
  category?: string
  subcategory?: string
  zipCodes?: string[]
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export interface Review {
  id: string
  businessId: string
  userId?: string
  userName: string
  rating: number
  comment: string
  createdAt: string
  isVerified?: boolean
}

export interface Coupon {
  id: string
  businessId: string
  title: string
  description: string
  discountType: "percentage" | "fixed" | "bogo"
  discountValue: number
  expiresAt?: string
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export interface MediaItem {
  id: string
  businessId: string
  type: "image" | "video"
  url: string
  title?: string
  description?: string
  tags?: string[]
  folder?: string
  createdAt: string
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

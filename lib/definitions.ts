export interface Business {
  id: string
  firstName: string
  lastName: string
  businessName: string
  zipCode: string
  email: string
  passwordHash?: string
  isEmailVerified: boolean
  createdAt: string
  updatedAt: string
  category?: string
  phone?: string
  address?: string
  displayName?: string
  adDesignData?: any
  status?: "active" | "inactive" // Add status field
  subcategories?: string[]
  allSubcategories?: string[]
  serviceArea?: {
    zipCodes: string[]
    isNationwide: boolean
    radius?: number
    centralZip?: string
  }
  isNationwide?: boolean
  city?: string
  state?: string
  rating?: number
  reviews?: number
  reviewsData?: any[]
  plan?: string
  isPlaceholder?: boolean // Added optional property
}

export interface User {
  id: string
  email: string
  passwordHash: string
  firstName?: string
  lastName?: string
  createdAt: string
  updatedAt?: string
  lastLogin?: string
  status?: "active" | "inactive"
}

export interface Job {
  id: string
  businessId: string
  title: string
  description: string
  location: string
  type: string
  salary?: string
  requirements?: string[]
  benefits?: string[]
  categories?: string[]
  serviceArea?: {
    zipCodes: string[]
    isNationwide: boolean
    radius?: number
    centralZip?: string
  }
  createdAt: string
  expiresAt: string
  isActive: boolean
}

export interface Coupon {
  id: string
  businessId: string
  title: string
  description: string
  discount: string
  startDate: string
  expirationDate: string
  isActive: boolean
  usageCount: number
  maxUsage?: number
  createdAt: string
  imageId?: string
  imageUrl?: string
}

export interface ZipCode {
  zip: string
  city: string
  state: string
  county?: string
  latitude?: number
  longitude?: number
  population?: number
}

export interface Review {
  id: string
  businessId: string
  userId?: string
  rating: number
  title?: string
  comment?: string
  isVerified: boolean
  createdAt: string
  updatedAt?: string
}

export interface MediaFile {
  id: string
  businessId: string
  type: "image" | "video"
  url: string
  cloudflareId?: string
  filename: string
  size: number
  mimeType: string
  tags?: string[]
  folder?: string
  createdAt: string
}

export interface ServiceArea {
  zipCodes: string[]
  isNationwide: boolean
  radius?: number
  centralZip?: string
}

export interface BusinessCategory {
  id: string
  name: string
  parentId?: string
  path: string
}

export interface AnalyticsEvent {
  businessId: string
  eventType: string
  timestamp: number
  userAgent?: string
  ipAddress?: string
  zipCode?: string
  metadata?: Record<string, any>
}

export interface Session {
  id: string
  userId?: string
  businessId?: string
  type: "user" | "business"
  createdAt: string
  expiresAt: string
  metadata?: Record<string, any>
}

export interface KeywordData {
  businessId: string
  keywords: string[]
  updatedAt: string
}

export interface FavoriteData {
  userId: string
  businessId: string
  createdAt: string
}

export interface SearchResult {
  businesses: Business[]
  totalCount: number
  query: string
  zipCode?: string
  category?: string
}

export interface AdDesignData {
  designId: number
  colorScheme: string
  colorValues?: Record<string, string>
  texture?: string
  customButton?: {
    type: string
    name: string
    icon: string
  }
  customColors?: any
  desktopLayout?: {
    layoutType: string
    videoAspectRatio: string
  }
  headerTextColor?: string
  businessInfo?: {
    businessName: string
    streetAddress: string
    city: string
    state: string
    zipCode: string
    phone: string
    hours: string
    website: string
    freeText: string
  }
  hiddenFields?: Record<string, boolean>
  updatedAt: string
}

export interface HeaderImageData {
  imageId: string
  viewWindowPosition: { x: number; y: number }
  originalImageDimensions: { width: number; height: number }
  updatedAt: string
}

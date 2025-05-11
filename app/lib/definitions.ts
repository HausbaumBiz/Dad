export type Business = {
  id: string
  firstName: string
  lastName: string
  businessName: string
  zipCode: string
  email: string
  passwordHash: string
  isEmailVerified: boolean
  createdAt: string
  updatedAt: string
  phone?: string
  category?: string
  services?: string[]
  city?: string
  state?: string
  rating?: number
  reviews?: number
  reviewsData?: any[]
  plan?: string
}

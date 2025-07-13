"use client"

import { Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, Globe, Star, Users, Award, Clock } from "lucide-react"
import { CategoryLayout } from "@/components/category-layout"
import { PhotoCarousel } from "@/components/photo-carousel"
import { BusinessJobsDialog } from "@/components/business-jobs-dialog"
import { BusinessCouponsDialog } from "@/components/business-coupons-dialog"
import { BusinessPhotoAlbumDialog } from "@/components/business-photo-album-dialog"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { loadBusinessPhotos } from "@/app/actions/photo-actions"
import { useState } from "react"

const CATEGORY_NAME = "Financial Services"
const CATEGORY_DESCRIPTION = "Professional financial planning, accounting, tax preparation, and investment services"

// Sample businesses for financial services
const businesses = [
  {
    id: "1",
    name: "Premier Financial Planning",
    category: "Financial Planning",
    subcategory: "Investment Advisory",
    description: "Comprehensive financial planning and investment management services for individuals and families.",
    address: "123 Main Street, Downtown",
    city: "Springfield",
    state: "IL",
    zipCode: "62701",
    phone: "(555) 123-4567",
    website: "https://premierfinancial.com",
    email: "info@premierfinancial.com",
    rating: 4.8,
    reviewCount: 156,
    isVerified: true,
    isPremium: true,
    serviceArea: ["62701", "62702", "62703", "62704", "62705"],
    keywords: ["financial planning", "investment management", "retirement planning", "wealth management"],
    businessHours: {
      monday: "9:00 AM - 5:00 PM",
      tuesday: "9:00 AM - 5:00 PM",
      wednesday: "9:00 AM - 5:00 PM",
      thursday: "9:00 AM - 5:00 PM",
      friday: "9:00 AM - 5:00 PM",
      saturday: "By Appointment",
      sunday: "Closed",
    },
    specialties: ["Retirement Planning", "401k Management", "Estate Planning", "Tax Strategy"],
    certifications: ["CFP", "CFA", "ChFC"],
    yearsInBusiness: 15,
    employeeCount: 8,
  },
  {
    id: "2",
    name: "Springfield Tax & Accounting",
    category: "Tax Services",
    subcategory: "Tax Preparation",
    description: "Professional tax preparation and accounting services for individuals and small businesses.",
    address: "456 Oak Avenue, Suite 200",
    city: "Springfield",
    state: "IL",
    zipCode: "62702",
    phone: "(555) 234-5678",
    website: "https://springfieldtax.com",
    email: "contact@springfieldtax.com",
    rating: 4.6,
    reviewCount: 89,
    isVerified: true,
    isPremium: false,
    serviceArea: ["62701", "62702", "62703", "62704"],
    keywords: ["tax preparation", "accounting", "bookkeeping", "payroll"],
    businessHours: {
      monday: "8:00 AM - 6:00 PM",
      tuesday: "8:00 AM - 6:00 PM",
      wednesday: "8:00 AM - 6:00 PM",
      thursday: "8:00 AM - 6:00 PM",
      friday: "8:00 AM - 6:00 PM",
      saturday: "9:00 AM - 3:00 PM",
      sunday: "Closed",
    },
    specialties: ["Individual Tax Returns", "Business Tax Returns", "Bookkeeping", "Payroll Services"],
    certifications: ["CPA", "EA"],
    yearsInBusiness: 12,
    employeeCount: 5,
  },
  {
    id: "3",
    name: "Capital Investment Group",
    category: "Investment Services",
    subcategory: "Portfolio Management",
    description: "Professional investment management and portfolio advisory services for high-net-worth clients.",
    address: "789 Business Park Drive",
    city: "Springfield",
    state: "IL",
    zipCode: "62703",
    phone: "(555) 345-6789",
    website: "https://capitalinvestmentgroup.com",
    email: "advisors@capitalinvestmentgroup.com",
    rating: 4.9,
    reviewCount: 203,
    isVerified: true,
    isPremium: true,
    serviceArea: ["62701", "62702", "62703", "62704", "62705", "62706"],
    keywords: ["investment management", "portfolio management", "wealth advisory", "asset allocation"],
    businessHours: {
      monday: "8:00 AM - 5:00 PM",
      tuesday: "8:00 AM - 5:00 PM",
      wednesday: "8:00 AM - 5:00 PM",
      thursday: "8:00 AM - 5:00 PM",
      friday: "8:00 AM - 5:00 PM",
      saturday: "Closed",
      sunday: "Closed",
    },
    specialties: ["Portfolio Management", "Asset Allocation", "Risk Management", "Estate Planning"],
    certifications: ["CFA", "CFP", "CIMA"],
    yearsInBusiness: 20,
    employeeCount: 12,
  },
  {
    id: "4",
    name: "Community Credit Union",
    category: "Banking Services",
    subcategory: "Credit Union",
    description: "Full-service credit union offering banking, loans, and financial services to community members.",
    address: "321 Community Boulevard",
    city: "Springfield",
    state: "IL",
    zipCode: "62704",
    phone: "(555) 456-7890",
    website: "https://communitycu.org",
    email: "info@communitycu.org",
    rating: 4.7,
    reviewCount: 312,
    isVerified: true,
    isPremium: true,
    serviceArea: ["62701", "62702", "62703", "62704", "62705"],
    keywords: ["banking", "loans", "mortgages", "savings", "checking"],
    businessHours: {
      monday: "9:00 AM - 5:00 PM",
      tuesday: "9:00 AM - 5:00 PM",
      wednesday: "9:00 AM - 5:00 PM",
      thursday: "9:00 AM - 5:00 PM",
      friday: "9:00 AM - 6:00 PM",
      saturday: "9:00 AM - 1:00 PM",
      sunday: "Closed",
    },
    specialties: ["Personal Banking", "Business Banking", "Home Loans", "Auto Loans"],
    certifications: ["NCUA Insured", "Equal Housing Lender"],
    yearsInBusiness: 35,
    employeeCount: 25,
  },
]

function FinancialServicesContent() {
  const [businessPhotos, setBusinessPhotos] = useState<Record<string, string[]>>({})

  const loadPhotosForBusiness = async (businessId: string) => {
    if (businessPhotos[businessId]) return // Already loaded

    try {
      const photos = await loadBusinessPhotos(businessId)
      setBusinessPhotos((prev) => ({
        ...prev,
        [businessId]: photos,
      }))
    } catch (error) {
      console.error("Error loading photos for business:", businessId, error)
      setBusinessPhotos((prev) => ({
        ...prev,
        [businessId]: [],
      }))
    }
  }

  return (
    <div className="space-y-6">
      {businesses.map((business) => (
        <Card key={business.id} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex gap-4">
              {/* Left Column - Business Info */}
              <div className="flex-1 min-w-0 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{business.name}</h3>
                      {business.isVerified && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <Award className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {business.isPremium && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Premium
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {business.category} • {business.subcategory}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{business.rating}</span>
                        <span>({business.reviewCount} reviews)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{business.employeeCount} employees</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{business.yearsInBusiness} years</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-700 text-sm leading-relaxed">{business.description}</p>

                {/* Specialties */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Specialties</h4>
                  <div className="flex flex-wrap gap-1">
                    {business.specialties.map((specialty, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Certifications */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Certifications</h4>
                  <div className="flex flex-wrap gap-1">
                    {business.certifications.map((cert, index) => (
                      <Badge key={index} variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {business.address}, {business.city}, {business.state} {business.zipCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span>{business.phone}</span>
                  </div>
                  {business.website && (
                    <div className="flex items-center gap-2 text-gray-600 md:col-span-2">
                      <Globe className="h-4 w-4 flex-shrink-0" />
                      <a
                        href={business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 truncate"
                      >
                        {business.website}
                      </a>
                    </div>
                  )}
                </div>

                {/* Service Area */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Service Area</h4>
                  <div className="flex flex-wrap gap-1">
                    {business.serviceArea.slice(0, 5).map((zip, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {zip}
                      </Badge>
                    ))}
                    {business.serviceArea.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{business.serviceArea.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Center Column - Photos */}
              <div className="w-48 flex-shrink-0">
                <PhotoCarousel
                  businessId={business.id}
                  photos={businessPhotos[business.id] || []}
                  onLoadPhotos={() => loadPhotosForBusiness(business.id)}
                  showMultiple={true}
                  photosPerView={1}
                  className="w-full h-32"
                  size="medium"
                />
              </div>

              {/* Right Column - Actions */}
              <div className="w-32 flex-shrink-0 space-y-2">
                <BusinessProfileDialog business={business}>
                  <Button size="sm" className="w-full">
                    View Profile
                  </Button>
                </BusinessProfileDialog>

                <ReviewsDialog businessId={business.id} businessName={business.name}>
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    Reviews
                  </Button>
                </ReviewsDialog>

                <BusinessJobsDialog businessId={business.id} businessName={business.name}>
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    Jobs
                  </Button>
                </BusinessJobsDialog>

                <BusinessCouponsDialog businessId={business.id} businessName={business.name}>
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    Offers
                  </Button>
                </BusinessCouponsDialog>

                <BusinessPhotoAlbumDialog businessId={business.id} businessName={business.name}>
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    Photos
                  </Button>
                </BusinessPhotoAlbumDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function FinancialServicesPage() {
  return (
    <CategoryLayout title={CATEGORY_NAME} description={CATEGORY_DESCRIPTION} businessCount={businesses.length}>
      <Suspense fallback={<div>Loading financial services...</div>}>
        <FinancialServicesContent />
      </Suspense>
    </CategoryLayout>
  )
}

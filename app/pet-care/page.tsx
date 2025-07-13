"use client"

import { useState } from "react"
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

const CATEGORY_NAME = "Pet Care Services"
const CATEGORY_DESCRIPTION = "Professional pet care, veterinary services, grooming, boarding, and pet supplies"

// Sample businesses for pet care
const businesses = [
  {
    id: "1",
    name: "Happy Paws Veterinary Clinic",
    category: "Veterinary Services",
    subcategory: "General Practice",
    description:
      "Full-service veterinary clinic providing comprehensive medical care for dogs, cats, and small animals.",
    address: "123 Pet Lane, Suite A",
    city: "Springfield",
    state: "IL",
    zipCode: "62701",
    phone: "(555) 123-4567",
    website: "https://happypawsvet.com",
    email: "info@happypawsvet.com",
    rating: 4.8,
    reviewCount: 156,
    isVerified: true,
    isPremium: true,
    serviceArea: ["62701", "62702", "62703", "62704", "62705"],
    keywords: ["veterinary", "pet care", "animal hospital", "vaccinations"],
    businessHours: {
      monday: "8:00 AM - 6:00 PM",
      tuesday: "8:00 AM - 6:00 PM",
      wednesday: "8:00 AM - 6:00 PM",
      thursday: "8:00 AM - 6:00 PM",
      friday: "8:00 AM - 6:00 PM",
      saturday: "9:00 AM - 4:00 PM",
      sunday: "Emergency Only",
    },
    specialties: ["General Medicine", "Surgery", "Dental Care", "Emergency Care"],
    certifications: ["AAHA Accredited", "Fear Free Certified"],
    yearsInBusiness: 15,
    employeeCount: 8,
  },
  {
    id: "2",
    name: "Pampered Pets Grooming",
    category: "Pet Grooming",
    subcategory: "Full Service Grooming",
    description: "Professional pet grooming services including baths, haircuts, nail trimming, and spa treatments.",
    address: "456 Grooming Way",
    city: "Springfield",
    state: "IL",
    zipCode: "62702",
    phone: "(555) 234-5678",
    website: "https://pamperedpetsgrooming.com",
    email: "book@pamperedpetsgrooming.com",
    rating: 4.6,
    reviewCount: 89,
    isVerified: true,
    isPremium: false,
    serviceArea: ["62701", "62702", "62703", "62704"],
    keywords: ["pet grooming", "dog grooming", "cat grooming", "nail trimming"],
    businessHours: {
      monday: "Closed",
      tuesday: "9:00 AM - 5:00 PM",
      wednesday: "9:00 AM - 5:00 PM",
      thursday: "9:00 AM - 5:00 PM",
      friday: "9:00 AM - 5:00 PM",
      saturday: "8:00 AM - 4:00 PM",
      sunday: "10:00 AM - 3:00 PM",
    },
    specialties: ["Full Service Grooming", "Nail Care", "Flea Treatments", "De-shedding"],
    certifications: ["Certified Master Groomer", "Pet First Aid"],
    yearsInBusiness: 8,
    employeeCount: 4,
  },
  {
    id: "3",
    name: "Cozy Critters Pet Boarding",
    category: "Pet Boarding",
    subcategory: "Overnight Care",
    description: "Safe and comfortable pet boarding facility with individual suites and 24/7 supervision.",
    address: "789 Boarding Boulevard",
    city: "Springfield",
    state: "IL",
    zipCode: "62703",
    phone: "(555) 345-6789",
    website: "https://cozycritters.com",
    email: "reservations@cozycritters.com",
    rating: 4.9,
    reviewCount: 203,
    isVerified: true,
    isPremium: true,
    serviceArea: ["62701", "62702", "62703", "62704", "62705", "62706"],
    keywords: ["pet boarding", "dog boarding", "cat boarding", "pet hotel"],
    businessHours: {
      monday: "7:00 AM - 7:00 PM",
      tuesday: "7:00 AM - 7:00 PM",
      wednesday: "7:00 AM - 7:00 PM",
      thursday: "7:00 AM - 7:00 PM",
      friday: "7:00 AM - 7:00 PM",
      saturday: "8:00 AM - 6:00 PM",
      sunday: "8:00 AM - 6:00 PM",
    },
    specialties: ["Overnight Boarding", "Daycare", "Exercise Programs", "Special Needs Care"],
    certifications: ["Licensed Pet Care Facility", "Bonded & Insured"],
    yearsInBusiness: 12,
    employeeCount: 10,
  },
  {
    id: "4",
    name: "Tail Waggers Dog Training",
    category: "Pet Training",
    subcategory: "Dog Training",
    description: "Professional dog training services including obedience, behavioral modification, and puppy classes.",
    address: "321 Training Trail",
    city: "Springfield",
    state: "IL",
    zipCode: "62704",
    phone: "(555) 456-7890",
    website: "https://tailwaggers.com",
    email: "train@tailwaggers.com",
    rating: 4.7,
    reviewCount: 124,
    isVerified: true,
    isPremium: false,
    serviceArea: ["62701", "62702", "62703", "62704", "62705"],
    keywords: ["dog training", "obedience training", "puppy training", "behavioral training"],
    businessHours: {
      monday: "9:00 AM - 7:00 PM",
      tuesday: "9:00 AM - 7:00 PM",
      wednesday: "9:00 AM - 7:00 PM",
      thursday: "9:00 AM - 7:00 PM",
      friday: "9:00 AM - 7:00 PM",
      saturday: "9:00 AM - 5:00 PM",
      sunday: "12:00 PM - 5:00 PM",
    },
    specialties: ["Basic Obedience", "Advanced Training", "Puppy Classes", "Behavioral Issues"],
    certifications: ["CCPDT Certified", "AKC CGC Evaluator"],
    yearsInBusiness: 6,
    employeeCount: 3,
  },
]

function PetCareContent() {
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

export default function PetCarePage() {
  return (
    <CategoryLayout title={CATEGORY_NAME} description={CATEGORY_DESCRIPTION} businessCount={businesses.length}>
      <PetCareContent />
    </CategoryLayout>
  )
}

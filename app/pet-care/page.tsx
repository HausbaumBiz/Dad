import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Heart, MapPin, Phone, Star, Clock, DollarSign, Award, Users, Camera } from "lucide-react"
import Image from "next/image"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { BusinessJobsDialog } from "@/components/business-jobs-dialog"
import { BusinessCouponsDialog } from "@/components/business-coupons-dialog"
import { BusinessPhotoAlbumDialog } from "@/components/business-photo-album-dialog"

// Mock data for pet care businesses
const petCareBusinesses = [
  {
    id: "1",
    name: "Happy Paws Veterinary Clinic",
    category: "Veterinary Services",
    rating: 4.8,
    reviewCount: 127,
    address: "123 Main Street, Anytown, ST 12345",
    phone: "(555) 123-4567",
    hours: "Mon-Fri: 8AM-6PM, Sat: 9AM-4PM",
    priceRange: "$$$",
    specialties: ["Emergency Care", "Surgery", "Dental Care", "Vaccinations"],
    description: "Full-service veterinary clinic providing comprehensive care for your beloved pets.",
    photos: [
      "/placeholder.svg?height=144&width=192&text=Clinic+Exterior",
      "/placeholder.svg?height=144&width=192&text=Examination+Room",
      "/placeholder.svg?height=144&width=192&text=Surgery+Suite",
      "/placeholder.svg?height=144&width=192&text=Waiting+Area",
    ],
    awards: ["Best Vet 2023", "Excellence in Pet Care"],
    yearsInBusiness: 15,
    staffCount: 8,
  },
  {
    id: "2",
    name: "Pampered Paws Grooming",
    category: "Pet Grooming",
    rating: 4.9,
    reviewCount: 89,
    address: "456 Oak Avenue, Anytown, ST 12345",
    phone: "(555) 234-5678",
    hours: "Tue-Sat: 9AM-5PM",
    priceRange: "$$",
    specialties: ["Full Service Grooming", "Nail Trimming", "Flea Treatments", "Show Cuts"],
    description: "Professional pet grooming services to keep your furry friends looking and feeling their best.",
    photos: [
      "/placeholder.svg?height=144&width=192&text=Grooming+Station",
      "/placeholder.svg?height=144&width=192&text=Bath+Area",
      "/placeholder.svg?height=144&width=192&text=Drying+Room",
      "/placeholder.svg?height=144&width=192&text=Before+After",
    ],
    awards: ["Top Groomer 2023"],
    yearsInBusiness: 8,
    staffCount: 4,
  },
  {
    id: "3",
    name: "Tail Waggers Pet Boarding",
    category: "Pet Boarding",
    rating: 4.7,
    reviewCount: 156,
    address: "789 Pine Road, Anytown, ST 12345",
    phone: "(555) 345-6789",
    hours: "24/7 Drop-off: 7AM-7PM",
    priceRange: "$$",
    specialties: ["Overnight Boarding", "Daycare", "Exercise Programs", "Medication Administration"],
    description: "Safe and comfortable boarding facility where your pets receive loving care while you're away.",
    photos: [
      "/placeholder.svg?height=144&width=192&text=Play+Area",
      "/placeholder.svg?height=144&width=192&text=Sleeping+Quarters",
      "/placeholder.svg?height=144&width=192&text=Outdoor+Yard",
      "/placeholder.svg?height=144&width=192&text=Staff+Interaction",
    ],
    awards: ["Pet Care Excellence 2023"],
    yearsInBusiness: 12,
    staffCount: 6,
  },
  {
    id: "4",
    name: "Critter Care Mobile Vet",
    category: "Mobile Veterinary",
    rating: 4.6,
    reviewCount: 73,
    address: "Serving Greater Anytown Area",
    phone: "(555) 456-7890",
    hours: "Mon-Fri: 8AM-6PM, Emergency on-call",
    priceRange: "$$$",
    specialties: ["House Calls", "Wellness Exams", "Vaccinations", "Senior Pet Care"],
    description: "Convenient mobile veterinary services bringing professional pet care directly to your home.",
    photos: [
      "/placeholder.svg?height=144&width=192&text=Mobile+Unit",
      "/placeholder.svg?height=144&width=192&text=Home+Visit",
      "/placeholder.svg?height=144&width=192&text=Equipment",
      "/placeholder.svg?height=144&width=192&text=Pet+Exam",
    ],
    awards: ["Innovation in Pet Care 2023"],
    yearsInBusiness: 5,
    staffCount: 3,
  },
  {
    id: "5",
    name: "Furry Friends Training Academy",
    category: "Pet Training",
    rating: 4.8,
    reviewCount: 94,
    address: "321 Elm Street, Anytown, ST 12345",
    phone: "(555) 567-8901",
    hours: "Mon-Sat: 9AM-7PM, Sun: 10AM-4PM",
    priceRange: "$$",
    specialties: ["Puppy Training", "Behavioral Modification", "Agility Training", "Private Sessions"],
    description: "Professional dog training services to help build a strong bond between you and your pet.",
    photos: [
      "/placeholder.svg?height=144&width=192&text=Training+Class",
      "/placeholder.svg?height=144&width=192&text=Agility+Course",
      "/placeholder.svg?height=144&width=192&text=One+on+One",
      "/placeholder.svg?height=144&width=192&text=Success+Stories",
    ],
    awards: ["Best Training Program 2023"],
    yearsInBusiness: 10,
    staffCount: 5,
  },
  {
    id: "6",
    name: "Exotic Pet Specialists",
    category: "Exotic Veterinary",
    rating: 4.9,
    reviewCount: 45,
    address: "654 Maple Drive, Anytown, ST 12345",
    phone: "(555) 678-9012",
    hours: "Mon-Fri: 10AM-6PM, Sat: 10AM-2PM",
    priceRange: "$$$$",
    specialties: ["Birds", "Reptiles", "Small Mammals", "Exotic Surgery"],
    description: "Specialized veterinary care for exotic pets including birds, reptiles, and small mammals.",
    photos: [
      "/placeholder.svg?height=144&width=192&text=Exotic+Exam",
      "/placeholder.svg?height=144&width=192&text=Bird+Care",
      "/placeholder.svg?height=144&width=192&text=Reptile+Setup",
      "/placeholder.svg?height=144&width=192&text=Small+Mammals",
    ],
    awards: ["Exotic Care Excellence 2023"],
    yearsInBusiness: 7,
    staffCount: 4,
  },
]

// Photo Carousel Component
function PhotoCarousel({ photos, businessName }: { photos: string[]; businessName: string }) {
  return (
    <Carousel className="w-full max-w-xs mx-auto">
      <CarouselContent>
        {photos.map((photo, index) => (
          <CarouselItem key={index}>
            <div className="p-1">
              <Image
                src={photo || "/placeholder.svg"}
                alt={`${businessName} photo ${index + 1}`}
                width={192}
                height={144}
                className="w-48 h-36 object-cover rounded-lg"
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}

export default function PetCarePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Pet Care Services</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find trusted veterinarians, groomers, trainers, and boarding facilities for your beloved pets
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div className="text-center py-8">Loading pet care services...</div>}>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {petCareBusinesses.map((business) => (
              <Card key={business.id} className="hover:shadow-lg transition-shadow duration-300 bg-white">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl font-semibold text-gray-900 leading-tight">{business.name}</CardTitle>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 p-1">
                      <Heart className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="ml-1 text-sm font-medium">{business.rating}</span>
                    </div>
                    <span className="text-sm text-gray-500">({business.reviewCount} reviews)</span>
                    <Badge variant="secondary" className="text-xs">
                      {business.category}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{business.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{business.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{business.hours}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 flex-shrink-0" />
                      <span>{business.priceRange}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Photo Carousel */}
                  <div className="mb-4">
                    <PhotoCarousel photos={business.photos} businessName={business.name} />
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 leading-relaxed">{business.description}</p>

                  {/* Specialties */}
                  <div className="flex flex-col lg:flex-row lg:gap-4">
                    <div className="lg:w-64 mb-2 lg:mb-0">
                      <span className="text-sm font-medium text-gray-700">Specialties:</span>
                    </div>
                    <div className="w-full flex flex-wrap gap-1">
                      {business.specialties.map((specialty, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Awards and Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        <span>{business.awards.length} awards</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{business.staffCount} staff</span>
                      </div>
                    </div>
                    <span>{business.yearsInBusiness} years in business</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4">
                    <BusinessProfileDialog businessId={business.id}>
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        View Profile
                      </Button>
                    </BusinessProfileDialog>

                    <BusinessJobsDialog businessId={business.id}>
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        Services
                      </Button>
                    </BusinessJobsDialog>

                    <BusinessCouponsDialog businessId={business.id}>
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        Offers
                      </Button>
                    </BusinessCouponsDialog>

                    <BusinessPhotoAlbumDialog businessId={business.id}>
                      <Button variant="outline" size="sm" className="p-2 bg-transparent">
                        <Camera className="h-4 w-4" />
                      </Button>
                    </BusinessPhotoAlbumDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Suspense>
      </div>
    </div>
  )
}

"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function PetCarePage() {
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<{
    id: number
    name: string
    rating: number
    reviews: number
  } | null>(null)

  const filterOptions = [
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

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Paws & Claws Veterinary Clinic",
      services: ["Veterinarians", "Pet Hospitals"],
      rating: 4.9,
      reviews: 156,
      location: "North Canton, OH",
    },
    {
      id: 2,
      name: "Furry Friends Grooming",
      services: ["Pet Groomers"],
      rating: 4.8,
      reviews: 124,
      location: "Canton, OH",
    },
    {
      id: 3,
      name: "Happy Tails Pet Sitting & Walking",
      services: ["Pet Sitters", "Pet Walkers"],
      rating: 4.7,
      reviews: 87,
      location: "Akron, OH",
    },
  ])

  // Mock reviews data
  const mockReviews = {
    "Paws & Claws Veterinary Clinic": [
      {
        id: 1,
        userName: "Emily Johnson",
        rating: 5,
        comment:
          "Dr. Martinez at Paws & Claws is amazing! My cat had a urinary tract infection and they got us in right away. The staff was so gentle with my nervous kitty and explained everything clearly. The follow-up care was excellent too.",
        date: "2023-10-15",
      },
      {
        id: 2,
        userName: "Michael Thompson",
        rating: 5,
        comment:
          "We've been bringing our dogs here for years. The entire team is knowledgeable and compassionate. When our older dog needed surgery, they walked us through every step and the recovery went smoothly. Highly recommend!",
        date: "2023-09-22",
      },
      {
        id: 3,
        userName: "Sarah Wilson",
        rating: 4,
        comment:
          "Very professional clinic with state-of-the-art equipment. The only reason for 4 stars instead of 5 is that sometimes the wait can be long, even with an appointment. But the quality of care is worth it.",
        date: "2023-11-05",
      },
      {
        id: 4,
        userName: "David Miller",
        rating: 5,
        comment:
          "When my puppy swallowed something he shouldn't have, Paws & Claws treated it as the emergency it was. They stayed late to perform the procedure and called me multiple times with updates. Forever grateful!",
        date: "2023-08-30",
      },
    ],
    "Furry Friends Grooming": [
      {
        id: 1,
        userName: "Jennifer Adams",
        rating: 5,
        comment:
          "My poodle looks absolutely gorgeous after every visit to Furry Friends! They're so patient with her, and she actually enjoys going there, which says a lot. The groomers really understand breed-specific cuts.",
        date: "2023-11-10",
      },
      {
        id: 2,
        userName: "Robert Chen",
        rating: 4,
        comment:
          "Good grooming service. My golden retriever always comes back clean and well-groomed. They do a great job with the de-shedding treatment. Only giving 4 stars because they're often running behind schedule.",
        date: "2023-10-05",
      },
      {
        id: 3,
        userName: "Amanda Garcia",
        rating: 5,
        comment:
          "I have a very anxious rescue dog who had bad experiences with groomers in the past. The team at Furry Friends took extra time to make him comfortable, and now he's much more relaxed during grooming. Worth every penny!",
        date: "2023-09-18",
      },
    ],
    "Happy Tails Pet Sitting & Walking": [
      {
        id: 1,
        userName: "Thomas Wright",
        rating: 5,
        comment:
          "Lisa from Happy Tails has been walking our two dogs daily for the past six months. She's reliable, caring, and sends us photos during each visit. Our dogs get so excited when she arrives!",
        date: "2023-11-15",
      },
      {
        id: 2,
        userName: "Melissa King",
        rating: 5,
        comment:
          "We used Happy Tails for in-home pet sitting while on vacation for two weeks. They took excellent care of our cats and even watered our plants. The daily updates gave us peace of mind. Will definitely use again!",
        date: "2023-10-20",
      },
      {
        id: 3,
        userName: "Kevin Patel",
        rating: 4,
        comment:
          "Reliable dog walking service. Our walker is great with our energetic lab mix and always makes sure he gets enough exercise. The only improvement would be more detailed reports on how the walks went.",
        date: "2023-09-12",
      },
      {
        id: 4,
        userName: "Laura Martinez",
        rating: 5,
        comment:
          "When our regular pet sitter canceled last minute, Happy Tails saved the day! They arranged care for our elderly dog with special needs within hours. The sitter followed his medication schedule perfectly and sent us updates throughout the day.",
        date: "2023-08-05",
      },
    ],
  }

  const handleOpenReviews = (provider: (typeof providers)[0]) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Pet Care Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="/cat and dog.png"
            alt="Pet Care Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified pet care professionals in your area. Browse services below or use filters to narrow your
            search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Verified and experienced pet care professionals</li>
              <li>Read reviews from other pet owners</li>
              <li>Compare services and rates</li>
              <li>Find all the care your pets need in one place</li>
            </ul>
          </div>
        </div>
      </div>

      <CategoryFilter options={filterOptions} />

      <div className="space-y-6">
        {providers.map((provider) => (
          <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{provider.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{provider.location}</p>

                  <div className="flex items-center mt-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${i < Math.floor(provider.rating) ? "text-yellow-400" : "text-gray-300"}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 ml-2">
                      {provider.rating} ({provider.reviews} reviews)
                    </span>
                  </div>

                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700">Services:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {provider.services.map((service, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end justify-between">
                  <Button className="w-full md:w-auto" onClick={() => handleOpenReviews(provider)}>
                    Reviews
                  </Button>
                  <Button variant="outline" className="mt-2 w-full md:w-auto">
                    View Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={selectedProvider.name}
          reviews={mockReviews[selectedProvider.name as keyof typeof mockReviews] || []}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}

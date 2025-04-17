"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function AudioVisualSecurityPage() {
  const filterOptions = [
    { id: "audiovisual1", label: "Smart Home Setup", value: "Smart Home Setup" },
    { id: "audiovisual2", label: "Home Security Solutions", value: "Home Security Solutions" },
    { id: "audiovisual3", label: "Cinema Room Setup", value: "Cinema Room Setup" },
    { id: "audiovisual4", label: "Telecommunication", value: "Telecommunication" },
    { id: "audiovisual5", label: "Cable/Satellite/Antenna Television", value: "Cable/Satellite/Antenna Television" },
    { id: "audiovisual6", label: "Computer Repair", value: "Computer Repair" },
    {
      id: "audiovisual7",
      label: "Other Audio/Visual and Home Security",
      value: "Other Audio/Visual and Home Security",
    },
  ]

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // Mock reviews data
  const mockReviews = {
    "Smart Home Pros": [
      {
        id: 1,
        username: "TechSavvyHomeowner",
        rating: 5,
        date: "2023-11-15",
        comment:
          "Incredible smart home setup! They integrated all my devices seamlessly and even taught me how to use the app to control everything. My home feels like it's from the future!",
      },
      {
        id: 2,
        username: "SecurityMinded",
        rating: 4,
        date: "2023-10-22",
        comment:
          "Great security system installation. The cameras are discreet but effective, and the app notifications work perfectly. Only wish the installation was a bit quicker.",
      },
      {
        id: 3,
        username: "ModernLiving",
        rating: 5,
        date: "2023-09-30",
        comment:
          "Transformed my home with smart lighting, thermostats, and security. Everything works together perfectly and has actually saved me money on energy bills!",
      },
    ],
    "Home Theater Experts": [
      {
        id: 1,
        username: "MovieBuff2023",
        rating: 5,
        date: "2023-11-05",
        comment:
          "My cinema room is AMAZING! Perfect sound setup, projector mounted perfectly, and they even helped with acoustic treatments. Movie nights are now incredible!",
      },
      {
        id: 2,
        username: "SportsWatcher",
        rating: 4,
        date: "2023-10-12",
        comment:
          "Great satellite TV installation. All channels come in clearly and they set up multi-room viewing. The technician was knowledgeable and friendly.",
      },
      {
        id: 3,
        username: "AudiophileGuy",
        rating: 5,
        date: "2023-09-18",
        comment:
          "The surround sound system they installed is phenomenal. The attention to detail with speaker placement and calibration makes all the difference.",
      },
    ],
    "Tech Support Solutions": [
      {
        id: 1,
        username: "RemoteWorker",
        rating: 5,
        date: "2023-11-10",
        comment:
          "Fixed my computer issues quickly and efficiently. They also set up a better backup system so I won't lose work files again. Highly recommend!",
      },
      {
        id: 2,
        username: "SlowInternet",
        rating: 4,
        date: "2023-10-05",
        comment:
          "Resolved our home network issues and improved our WiFi coverage throughout the house. No more dead spots! Very professional service.",
      },
      {
        id: 3,
        username: "BusinessOwner",
        rating: 5,
        date: "2023-09-22",
        comment:
          "Set up our small business phone system and network. Everything works flawlessly and they provided excellent training for our staff.",
      },
    ],
    "Security Systems Inc": [
      {
        id: 1,
        username: "SafetyFirst",
        rating: 5,
        date: "2023-11-20",
        comment:
          "Excellent security system installation. The motion sensors, cameras, and alarm are all working perfectly. Feel much safer in our home now.",
      },
      {
        id: 2,
        username: "TravelingFamily",
        rating: 4,
        date: "2023-10-15",
        comment:
          "Great smart home integration with our security system. Being able to check cameras and lock doors remotely gives us peace of mind when traveling.",
      },
      {
        id: 3,
        username: "NewHomeowner",
        rating: 5,
        date: "2023-09-05",
        comment:
          "Installed a comprehensive security system in our new home. The technicians were professional and explained everything clearly. Highly recommend!",
      },
    ],
  }

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Smart Home Pros",
      services: ["Smart Home Setup", "Home Security Solutions"],
      rating: 4.8,
      reviews: 124,
      location: "Canton, OH",
    },
    {
      id: 2,
      name: "Home Theater Experts",
      services: ["Cinema Room Setup", "Cable/Satellite/Antenna Television"],
      rating: 4.9,
      reviews: 87,
      location: "North Canton, OH",
    },
    {
      id: 3,
      name: "Tech Support Solutions",
      services: ["Computer Repair", "Telecommunication"],
      rating: 4.7,
      reviews: 56,
      location: "Akron, OH",
    },
    {
      id: 4,
      name: "Security Systems Inc",
      services: ["Home Security Solutions", "Smart Home Setup"],
      rating: 4.6,
      reviews: 92,
      location: "Massillon, OH",
    },
  ])

  // Handle opening reviews dialog
  const handleOpenReviews = (provider) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Audio/Visual and Home Security" backLink="/home-improvement" backText="Home Improvement">
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
                  <Button className="w-full md:w-auto" onClick={() => handleOpenReviews(provider.name)}>
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

      {/* Reviews Dialog */}
      <ReviewsDialog
        isOpen={isReviewsDialogOpen}
        onClose={() => setIsReviewsDialogOpen(false)}
        providerName={selectedProvider}
        reviews={selectedProvider ? mockReviews[selectedProvider] || [] : []}
      />

      <Toaster />
    </CategoryLayout>
  )
}

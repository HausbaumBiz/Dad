"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function ConstructionDesignPage() {
  const filterOptions = [
    { id: "homeconstruction1", label: "General Contractors", value: "General Contractors" },
    { id: "homeconstruction2", label: "Architect", value: "Architect" },
    { id: "homeconstruction3", label: "Home Remodeling", value: "Home Remodeling" },
    { id: "homeconstruction4", label: "Demolition", value: "Demolition" },
    { id: "homeconstruction5", label: "Excavating/Earth Moving", value: "Excavating/Earth Moving" },
    { id: "homeconstruction6", label: "Land Surveyors", value: "Land Surveyors" },
    {
      id: "homeconstruction7",
      label: "Other Home Construction and Design",
      value: "Other Home Construction and Design",
    },
  ]

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Premier Construction Group",
      services: ["General Contractors", "Home Remodeling"],
      rating: 4.9,
      reviews: 142,
      location: "North Canton, OH",
    },
    {
      id: 2,
      name: "Modern Design Architects",
      services: ["Architect", "Home Remodeling"],
      rating: 4.8,
      reviews: 98,
      location: "Canton, OH",
    },
    {
      id: 3,
      name: "Precision Excavation Services",
      services: ["Excavating/Earth Moving", "Demolition"],
      rating: 4.7,
      reviews: 76,
      location: "Akron, OH",
    },
    {
      id: 4,
      name: "Accurate Land Surveying",
      services: ["Land Surveyors"],
      rating: 4.9,
      reviews: 64,
      location: "North Canton, OH",
    },
  ])

  // Mock reviews data
  const mockReviews = {
    "Premier Construction Group": [
      {
        id: 1,
        username: "DreamHomeOwner",
        rating: 5,
        date: "2023-08-15",
        comment:
          "Premier Construction Group handled our whole-home renovation with exceptional skill. They stayed on budget and finished ahead of schedule!",
      },
      {
        id: 2,
        username: "KitchenRemodel2023",
        rating: 5,
        date: "2023-07-20",
        comment:
          "Our kitchen remodel turned out better than we imagined. Their attention to detail and craftsmanship is outstanding.",
      },
      {
        id: 3,
        username: "AdditionProject",
        rating: 4,
        date: "2023-06-12",
        comment:
          "They added a 500 sq ft addition to our home. The transition between old and new is seamless. Only minor communication issues during the project.",
      },
    ],
    "Modern Design Architects": [
      {
        id: 1,
        username: "ContemporaryHome",
        rating: 5,
        date: "2023-08-05",
        comment:
          "Modern Design created plans for our contemporary home that perfectly balanced aesthetics and functionality. They were responsive to all our requests.",
      },
      {
        id: 2,
        username: "HistoricRenovation",
        rating: 4,
        date: "2023-07-18",
        comment:
          "They helped us renovate our 1920s home while preserving its historic character. Their knowledge of period-appropriate details was impressive.",
      },
      {
        id: 3,
        username: "SmallSpaceSolutions",
        rating: 5,
        date: "2023-06-30",
        comment:
          "Our small urban lot presented challenges, but their creative design maximized every inch of space. The result is both beautiful and practical.",
      },
    ],
    "Precision Excavation Services": [
      {
        id: 1,
        username: "NewFoundation",
        rating: 5,
        date: "2023-08-12",
        comment:
          "Precision Excavation prepared the site for our new home foundation. Their work was precise, and they handled some unexpected rock formations professionally.",
      },
      {
        id: 2,
        username: "DemolitionProject",
        rating: 4,
        date: "2023-07-25",
        comment:
          "They demolished our old garage safely and efficiently. The cleanup was thorough, and they salvaged materials as requested.",
      },
      {
        id: 3,
        username: "DrainageSolution",
        rating: 5,
        date: "2023-06-15",
        comment:
          "We had serious water issues on our property. Their excavation and drainage solution has completely resolved the problem. No more flooded basement!",
      },
    ],
    "Accurate Land Surveying": [
      {
        id: 1,
        username: "PropertyBoundary",
        rating: 5,
        date: "2023-08-20",
        comment:
          "Accurate Land Surveying resolved a boundary dispute with our neighbor. Their documentation was thorough and stood up to legal scrutiny.",
      },
      {
        id: 2,
        username: "NewConstruction",
        rating: 5,
        date: "2023-07-15",
        comment:
          "They surveyed our lot before construction began. Their detailed topographical map helped our architect design a home that works with the natural contours.",
      },
      {
        id: 3,
        username: "LotSplit",
        rating: 4,
        date: "2023-06-10",
        comment:
          "We used them to split our large lot for development. The process was smooth, and they handled all the necessary documentation for the county.",
      },
    ],
  }

  // Function to handle opening the reviews dialog
  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Home Construction and Design" backLink="/home-improvement" backText="Home Improvement">
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

      {/* Reviews Dialog */}
      <ReviewsDialog
        isOpen={isReviewsDialogOpen}
        onClose={() => setIsReviewsDialogOpen(false)}
        providerName={selectedProvider?.name}
        reviews={selectedProvider ? mockReviews[selectedProvider.name] : []}
      />

      <Toaster />
    </CategoryLayout>
  )
}

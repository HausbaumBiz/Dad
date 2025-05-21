"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function FoodDiningPage() {
  const filterOptions = [
    { id: "restaurant1", label: "Asian", value: "Asian" },
    { id: "restaurant2", label: "Indian", value: "Indian" },
    { id: "restaurant3", label: "Middle Eastern", value: "Middle Eastern" },
    { id: "restaurant4", label: "Mexican", value: "Mexican" },
    { id: "restaurant5", label: "Italian", value: "Italian" },
    { id: "restaurant6", label: "American", value: "American" },
    { id: "restaurant7", label: "Greek", value: "Greek" },
    { id: "restaurant8", label: "Other Ethnic Foods", value: "Other Ethnic Foods" },
    { id: "restaurant9", label: "Upscale", value: "Upscale" },
    { id: "restaurant10", label: "Casual", value: "Casual" },
    { id: "restaurant11", label: "Coffee and Tea Shops", value: "Coffee and Tea Shops" },
    { id: "restaurant12", label: "Ice Cream, Confectionery and Cakes", value: "Ice Cream, Confectionery and Cakes" },
    { id: "restaurant13", label: "Pizzeria", value: "Pizzeria" },
    { id: "restaurant14", label: "Bars/Pubs/Taverns", value: "Bars/Pubs/Taverns" },
    {
      id: "restaurant15",
      label: "Organic/Vegan/Vegetarian/Farm to table",
      value: "Organic/Vegan/Vegetarian/Farm to table",
    },
  ]

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Bella Italia Restaurant",
      services: ["Italian", "Upscale"],
      rating: 4.9,
      reviews: 156,
      location: "North Canton, OH",
    },
    {
      id: 2,
      name: "Morning Brew Coffee House",
      services: ["Coffee and Tea Shops", "Casual"],
      rating: 4.8,
      reviews: 124,
      location: "Canton, OH",
    },
    {
      id: 3,
      name: "Green Plate Vegan Bistro",
      services: ["Organic/Vegan/Vegetarian/Farm to table"],
      rating: 4.7,
      reviews: 87,
      location: "Akron, OH",
    },
  ])

  const [selectedProvider, setSelectedProvider] = useState<number | null>(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // Mock reviews data
  const mockReviews = [
    {
      id: 1,
      userName: "JohnD",
      rating: 5,
      comment:
        "Absolutely fantastic food and service! The pasta was cooked to perfection and the staff was very attentive.",
      date: "2023-12-15",
    },
    {
      id: 2,
      userName: "MaryS",
      rating: 4,
      comment: "Great atmosphere and delicious food. Slightly pricey but worth it for special occasions.",
      date: "2023-11-28",
    },
    {
      id: 3,
      userName: "RobertJ",
      rating: 5,
      comment: "Best Italian restaurant in town! Their tiramisu is to die for.",
      date: "2023-10-05",
    },
  ]

  // Add a function to handle opening the reviews dialog
  const handleReviewsClick = (providerId: number) => {
    setSelectedProvider(providerId)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Food & Dining" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/food%20service-Dz8Ysy9mwKkqz0nqDYzsqbRGOGvEFy.png"
            alt="Food and Dining"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find restaurants and dining options in your area. Browse options below or use filters to narrow your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Discover local restaurants and dining options</li>
              <li>Read reviews from other diners</li>
              <li>Browse menus and special offers</li>
              <li>Find the perfect dining experience for any occasion</li>
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
                    <p className="text-sm font-medium text-gray-700">Categories:</p>
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
                  <Button className="w-full md:w-auto">View Menu</Button>
                  <Button className="mt-2 w-full md:w-auto" onClick={() => handleReviewsClick(provider.id)}>
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
      {selectedProvider !== null && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={providers.find((p) => p.id === selectedProvider)?.name || ""}
          businessId={selectedProvider.toString()}
          reviews={mockReviews}
        />
      )}
      <Toaster />
    </CategoryLayout>
  )
}

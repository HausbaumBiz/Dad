"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function RetailStoresPage() {
  const filterOptions = [
    { id: "retail1", label: "Supermarkets/Grocery Stores", value: "Supermarkets/Grocery Stores" },
    { id: "retail2", label: "Department Store", value: "Department Store" },
    { id: "retail3", label: "Convenience Store", value: "Convenience Store" },
    { id: "retail4", label: "Clothing Boutique", value: "Clothing Boutique" },
    { id: "retail5", label: "Discount Store", value: "Discount Store" },
    { id: "retail6", label: "Warehouse Store", value: "Warehouse Store" },
    { id: "retail7", label: "Electronics Store", value: "Electronics Store" },
    { id: "retail8", label: "Bookstore", value: "Bookstore" },
    { id: "retail9", label: "Jewelry Store", value: "Jewelry Store" },
    { id: "retail10", label: "Toy Store", value: "Toy Store" },
    { id: "retail11", label: "Sporting Goods Store", value: "Sporting Goods Store" },
    { id: "retail12", label: "Furniture Store", value: "Furniture Store" },
    { id: "retail13", label: "Pet Store", value: "Pet Store" },
    { id: "retail14", label: "Shoe Store", value: "Shoe Store" },
    { id: "retail15", label: "Hardware Store", value: "Hardware Store" },
    { id: "retail16", label: "Stationery Store", value: "Stationery Store" },
    { id: "retail17", label: "Auto Parts Store", value: "Auto Parts Store" },
    { id: "retail18", label: "Health Food Store", value: "Health Food Store" },
    { id: "retail19", label: "Wine Shop/Alcohol Sales", value: "Wine Shop/Alcohol Sales" },
    { id: "retail20", label: "Antique Shop", value: "Antique Shop" },
  ]

  // State for reviews dialog
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<{
    id: number
    name: string
    reviews: any[]
  } | null>(null)

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Main Street Boutique",
      services: ["Clothing Boutique", "Shoe Store"],
      rating: 4.9,
      reviews: 124,
      location: "North Canton, OH",
      reviewsData: [
        {
          id: 1,
          userName: "Rebecca H.",
          rating: 5,
          comment:
            "This boutique has the most unique clothing items! The staff is incredibly helpful and honest about how things look. I always find something special here that I can't get anywhere else.",
          date: "2023-04-10",
        },
        {
          id: 2,
          userName: "Jessica M.",
          rating: 5,
          comment:
            "I love their shoe selection! They carry comfortable yet stylish options that are perfect for work. The owner has a great eye for fashion and can help you put together complete outfits.",
          date: "2023-03-22",
        },
        {
          id: 3,
          userName: "Brian T.",
          rating: 4,
          comment:
            "Bought a gift for my wife here and she loved it. The prices are a bit high, but the quality and uniqueness of the items make it worth it. Great customer service too.",
          date: "2023-02-15",
        },
      ],
    },
    {
      id: 2,
      name: "Tech Haven Electronics",
      services: ["Electronics Store"],
      rating: 4.8,
      reviews: 87,
      location: "Canton, OH",
      reviewsData: [
        {
          id: 1,
          userName: "Alex K.",
          rating: 5,
          comment:
            "Finally, an electronics store with staff who actually know what they're talking about! They helped me build a custom PC that perfectly fits my needs and budget.",
          date: "2023-04-05",
        },
        {
          id: 2,
          userName: "Michelle P.",
          rating: 4,
          comment:
            "Great selection of products and competitive prices. The staff is knowledgeable and not pushy. They offer good warranty options too.",
          date: "2023-03-18",
        },
        {
          id: 3,
          userName: "Daniel R.",
          rating: 5,
          comment:
            "I had an issue with a laptop I purchased, and they went above and beyond to resolve it. Their customer service is exceptional, and they stand behind what they sell.",
          date: "2023-02-27",
        },
      ],
    },
    {
      id: 3,
      name: "Fresh Market Grocery",
      services: ["Supermarkets/Grocery Stores", "Health Food Store"],
      rating: 4.7,
      reviews: 156,
      location: "Akron, OH",
      reviewsData: [
        {
          id: 1,
          userName: "Sarah J.",
          rating: 5,
          comment:
            "The produce here is always fresh and they have a great selection of organic options. Their prepared foods section is perfect for busy weeknights when I don't have time to cook.",
          date: "2023-04-12",
        },
        {
          id: 2,
          userName: "Michael B.",
          rating: 4,
          comment:
            "Good variety of health food options and specialty items that are hard to find elsewhere. Prices are a bit higher than regular grocery stores, but the quality is worth it.",
          date: "2023-03-30",
        },
        {
          id: 3,
          userName: "Emily W.",
          rating: 5,
          comment:
            "I love their bulk section where you can get exactly the amount you need. The staff is friendly and the store is always clean. Their local products section is fantastic too!",
          date: "2023-02-15",
        },
      ],
    },
  ])

  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Retail Stores" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/retail-LMdA5FnQ5i2okSiyh63eZFduC47jXp.png"
            alt="Retail Stores"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find local retail stores and shops in your area. Browse options below or use filters to narrow your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Discover local and independent retailers</li>
              <li>Read customer reviews before shopping</li>
              <li>Find special offers and promotions</li>
              <li>Support businesses in your community</li>
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
                    <p className="text-sm font-medium text-gray-700">Store Type:</p>
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
          reviews={selectedProvider.reviewsData}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}

"use client"

import { useState, useEffect } from "react"
import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { getBusinessesByCategory } from "@/app/actions/business-actions"
import { Loader2 } from "lucide-react"

export default function FoodDiningPage() {
  const { toast } = useToast()
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

  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [businesses, setBusinesses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBusinesses() {
      setIsLoading(true)
      try {
        const categoryFormats = [
          "food-dining",
          "Food & Dining",
          "foodDining",
          "restaurants",
          "Restaurants",
          "food",
          "Food",
        ]

        let allBusinesses: any[] = []

        for (const format of categoryFormats) {
          try {
            const result = await getBusinessesByCategory(format)
            if (result && result.length > 0) {
              allBusinesses = [...allBusinesses, ...result]
            }
          } catch (error) {
            console.error(`Error fetching businesses for format ${format}:`, error)
          }
        }

        const uniqueBusinesses = allBusinesses.filter(
          (business, index, self) => index === self.findIndex((b) => b.id === business.id),
        )

        setBusinesses(uniqueBusinesses)
      } catch (error) {
        console.error("Error fetching businesses:", error)
        toast({
          title: "Error loading businesses",
          description: "There was a problem loading businesses. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusinesses()
  }, [toast])

  const filteredBusinesses = selectedFilter
    ? businesses.filter((business) => {
        if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
          return business.allSubcategories.some((sub: string) =>
            sub.toLowerCase().includes(selectedFilter.toLowerCase()),
          )
        }
        if (business.subcategory) {
          return business.subcategory.toLowerCase().includes(selectedFilter.toLowerCase())
        }
        return false
      })
    : businesses

  const handleReviewsClick = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  const handleProfileClick = (provider: any) => {
    setSelectedProvider(provider)
    setIsProfileDialogOpen(true)
  }

  const handleFilterChange = (value: string) => {
    setSelectedFilter(value === selectedFilter ? null : value)
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
              <li>Read reviews from other customers</li>
              <li>View business videos showcasing work and staff</li>
              <li>Access exclusive coupons directly on each business listing</li>
              <li>Discover job openings from businesses you frequent yourself</li>
            </ul>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="animate-spin h-6 w-6" />
        </div>
      ) : (
        <>
          <CategoryFilter options={filterOptions} onChange={handleFilterChange} />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredBusinesses.map((provider: any) => (
              <Card key={provider.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col items-center">
                    <Image
                      src={provider.imageUrl || "/placeholder-image.png"}
                      alt={provider.name}
                      width={200}
                      height={150}
                      className="rounded-md object-cover mb-2"
                    />
                    <h3 className="text-lg font-semibold">{provider.name}</h3>
                    <p className="text-sm text-gray-500">{provider.subcategory}</p>
                    <div className="flex mt-2 space-x-2">
                      <Button size="sm" onClick={() => handleReviewsClick(provider)}>
                        Reviews
                      </Button>
                      <Button size="sm" onClick={() => handleProfileClick(provider)}>
                        Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <ReviewsDialog
        isOpen={isReviewsDialogOpen}
        onClose={() => setIsReviewsDialogOpen(false)}
        provider={selectedProvider}
      />
      <BusinessProfileDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
        provider={selectedProvider}
      />
      <Toaster />
    </CategoryLayout>
  )
}

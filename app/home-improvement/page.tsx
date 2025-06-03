"use client"

import { CategoryLayout } from "@/components/category-layout"
import { BusinessCard } from "@/components/business-card"
import { getBusinessesForCategoryPage } from "@/lib/data"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useUserZipCode } from "@/hooks/use-user-zipcode"

export default function HomeImprovementPage() {
  const { toast } = useToast()
  const { zipCode, hasZipCode } = useUserZipCode()
  const [businesses, setBusinesses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchBusinesses() {
      setIsLoading(true)
      try {
        const result = await getBusinessesForCategoryPage("/home-improvement", zipCode || undefined)
        setBusinesses(result)

        if (!hasZipCode) {
          toast({
            title: "No location set",
            description: "Set your zip code on the home page to see businesses in your area.",
            variant: "default",
          })
        }
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
  }, [toast, zipCode, hasZipCode])

  return (
    <CategoryLayout title="Home Improvement" backLink="/" backText="Categories">
      {hasZipCode && (
        <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <p className="text-sm text-primary">
            📍 Showing businesses that service zip code: <strong>{zipCode}</strong>
          </p>
        </div>
      )}

      {!hasZipCode && (
        <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            ⚠️ No location set.{" "}
            <a href="/" className="underline font-medium">
              Set your zip code
            </a>{" "}
            to see businesses in your area.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="w-full h-40" />
          ))}
        </div>
      ) : businesses.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {businesses.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-48">
          <p className="text-gray-500">No businesses found in your area.</p>
        </div>
      )}
    </CategoryLayout>
  )
}

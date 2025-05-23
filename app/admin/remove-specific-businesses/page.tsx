import { Suspense } from "react"
import RemoveSpecificBusinessesClient from "./remove-specific-businesses-client"
import { Skeleton } from "@/components/ui/skeleton"

export default function RemoveSpecificBusinessesPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Remove Specific Businesses</h1>
      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <RemoveSpecificBusinessesClient />
      </Suspense>
    </div>
  )
}

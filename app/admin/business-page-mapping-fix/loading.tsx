import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Business Page Mapping Fix</h1>
      <p className="mb-6 text-gray-600">
        This tool allows you to check and fix page mappings for specific businesses. You can remove a business from
        incorrect pages and ensure it's only mapped to the correct pages.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-48" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-24" />
            </div>

            <Skeleton className="h-40 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

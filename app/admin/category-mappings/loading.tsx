import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>

      <Card className="p-6 mb-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-20 w-full" />
      </Card>

      <div className="mb-8">
        <Skeleton className="h-10 w-full mb-4" />

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 bg-gray-100">
            <Skeleton className="h-6 w-full" />
          </div>

          <div className="divide-y">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="p-4">
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

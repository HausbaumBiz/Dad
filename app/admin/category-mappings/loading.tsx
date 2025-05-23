import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function CategoryMappingsLoading() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>

      <Card className="p-6 mb-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </Card>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 bg-gray-100">
          <Skeleton className="h-6 w-full col-span-3" />
          <Skeleton className="h-6 w-full col-span-3" />
          <Skeleton className="h-6 w-full col-span-3" />
          <Skeleton className="h-6 w-full col-span-2" />
          <Skeleton className="h-6 w-full col-span-1" />
        </div>

        <div className="divide-y">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="grid grid-cols-12 gap-4 p-4 items-center">
              <Skeleton className="h-6 w-full col-span-3" />
              <Skeleton className="h-6 w-full col-span-3" />
              <Skeleton className="h-6 w-full col-span-3" />
              <Skeleton className="h-6 w-full col-span-2" />
              <Skeleton className="h-6 w-full col-span-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

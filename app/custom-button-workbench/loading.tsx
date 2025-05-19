import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-6 w-48" />
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-8">
        <Skeleton className="h-10 w-64 mx-auto mb-2" />
        <Skeleton className="h-6 w-96 mx-auto mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
              <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-8 w-48" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-9" />
                </div>
              </div>

              <Skeleton className="w-full aspect-[4/3] mb-4" />

              <div className="flex flex-wrap gap-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-36" />
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <Skeleton className="h-[600px] w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-12 w-48 mb-6" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Skeleton className="h-[300px] w-full rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <div className="mt-4">
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>

      <Skeleton className="h-12 w-full mb-4" />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {Array(8)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
      </div>
    </div>
  )
}

import { CategoryLayout } from "@/components/category-layout"
import { Skeleton } from "@/components/ui/skeleton"

export default function PhysicalRehabilitationLoading() {
  return (
    <CategoryLayout title="Physical Rehabilitation" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Skeleton className="h-[300px] w-full rounded-lg" />
        <div className="space-y-6">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <Skeleton className="h-6 w-1/2 mb-2" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <Skeleton className="h-10 w-full mb-4" />
      </div>

      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-6">
            <div className="flex flex-col md:flex-row justify-between">
              <div className="space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
                <div className="pt-2">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end gap-2">
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </CategoryLayout>
  )
}

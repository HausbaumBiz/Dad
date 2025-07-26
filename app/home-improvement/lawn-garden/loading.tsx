import { CategoryLayout } from "@/components/category-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function LawnGardenLoading() {
  return (
    <CategoryLayout title="Lawn and Garden Services" backLink="/home-improvement" backText="Home Improvement">
      <div className="space-y-6">
        {/* Filter skeleton */}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24" />
          ))}
        </div>

        {/* Provider cards skeleton */}
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Skeleton key={j} className="h-6 w-20" />
                    ))}
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Skeleton className="h-32 w-full" />
                  </div>
                  <div className="flex flex-col gap-2 w-32">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </CategoryLayout>
  )
}

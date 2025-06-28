import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { MapPin, Activity, Users, Clock } from "lucide-react"

export default function ZipCodeTrackingTestLoading() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <Skeleton className="h-9 w-80 mx-auto" />
        <Skeleton className="h-5 w-96 mx-auto" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Controls Loading */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Test Controls
            </CardTitle>
            <CardDescription>Configure and run ZIP code tracking tests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Business Selection Loading */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>

            <Separator />

            {/* ZIP Code Selection Loading */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />

              {/* Quick Select Loading */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </div>

              {/* Custom ZIP Code Loading */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            <Separator />

            {/* Test Actions Loading */}
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Analytics Results Loading */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Live Analytics
            </CardTitle>
            <CardDescription>Real-time analytics data for the selected business</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary Stats Loading */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <Skeleton className="h-8 w-12 mx-auto mb-2" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <Skeleton className="h-8 w-12 mx-auto mb-2" />
                <Skeleton className="h-4 w-24 mx-auto" />
              </div>
            </div>

            {/* ZIP Code Analytics Loading */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
              </div>

              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-12" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-8" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Last Updated Loading */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>

            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Instructions Loading */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-28" />
              <div className="space-y-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <div className="space-y-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

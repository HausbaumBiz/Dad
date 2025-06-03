import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Phone, Globe, MapPin } from "lucide-react"
import { BusinessProfileDialog } from "./business-profile-dialog"
import { BusinessCouponsDialog } from "./business-coupons-dialog"
import { BusinessJobsDialog } from "./business-jobs-dialog"
import { BusinessPhotoAlbumDialog } from "./business-photo-album-dialog"
import { ReviewsDialog } from "./reviews-dialog"

export interface Business {
  id: string
  businessName: string
  city: string
  state: string
  zipCode: string
  phone: string
  website: string
  email: string
  description: string
  category: string
  subcategories: string[]
  createdAt: string
  updatedAt: string
  userId: string
  displayName?: string
  displayCity?: string
  displayState?: string
  displayPhone?: string
  displayLocation?: string
  adDesignData?: any
}

interface BusinessCardProps {
  business: Business
}

export function BusinessCard({ business }: BusinessCardProps) {
  const displayName = business.displayName || business.businessName || "Unnamed Business"
  const displayLocation = business.displayLocation || `${business.city}, ${business.state}`
  const displayPhone = business.displayPhone || business.phone

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold line-clamp-2">{displayName}</CardTitle>
        {displayLocation && (
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            {displayLocation}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {business.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{business.description}</p>
        )}

        {business.subcategories && business.subcategories.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {business.subcategories.slice(0, 3).map((subcategory, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {subcategory}
                </Badge>
              ))}
              {business.subcategories.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{business.subcategories.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="mt-auto space-y-2">
          {displayPhone && (
            <div className="flex items-center text-sm">
              <Phone className="h-4 w-4 mr-2" />
              <a href={`tel:${displayPhone}`} className="hover:underline">
                {displayPhone}
              </a>
            </div>
          )}

          {business.website && (
            <div className="flex items-center text-sm">
              <Globe className="h-4 w-4 mr-2" />
              <a
                href={business.website.startsWith("http") ? business.website : `https://${business.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline truncate"
              >
                {business.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <BusinessProfileDialog business={business}>
              <Button variant="outline" size="sm">
                View Profile
              </Button>
            </BusinessProfileDialog>

            <BusinessCouponsDialog businessId={business.id}>
              <Button variant="outline" size="sm">
                Coupons
              </Button>
            </BusinessCouponsDialog>

            <BusinessJobsDialog businessId={business.id}>
              <Button variant="outline" size="sm">
                Jobs
              </Button>
            </BusinessJobsDialog>

            <BusinessPhotoAlbumDialog businessId={business.id}>
              <Button variant="outline" size="sm">
                Photos
              </Button>
            </BusinessPhotoAlbumDialog>

            <ReviewsDialog businessId={business.id}>
              <Button variant="outline" size="sm">
                Reviews
              </Button>
            </ReviewsDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

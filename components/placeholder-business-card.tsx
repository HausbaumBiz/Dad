"use client"

import type { Business } from "@/lib/definitions"
import { Card, CardContent } from "@/components/ui/card"
import { Phone, MapPin } from "lucide-react"

export function PlaceholderBusinessCard({ business }: { business: Business }) {
  const phone = business.phone || ""
  const zip = business.zipCode || ""
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold">{business.displayName || business.businessName}</h3>
        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
          {phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>{phone}</span>
            </div>
          )}
          {zip && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>Zip: {zip}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

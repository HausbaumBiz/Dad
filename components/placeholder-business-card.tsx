"use client"

import type { Business } from "@/lib/definitions"
import { Card, CardContent } from "@/components/ui/card"
import { Phone, MapPin, CheckCircle } from "lucide-react"

export function PlaceholderBusinessCard({ business }: { business: Business }) {
  const phone = (business as any).phone || ""
  const zip = (business as any).zipCode || ""
  const isPlaceholder = Boolean((business as any)?.isPlaceholder)

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold">{(business as any).displayName || business.businessName}</h3>

        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
          {/* Prominent location line for placeholders */}
          {isPlaceholder && zip && (
            <div className="flex items-center gap-2 text-emerald-700 font-medium">
              <CheckCircle className="h-4 w-4" aria-hidden="true" />
              <span>
                {"\u2713"} Located in {zip}
              </span>
            </div>
          )}

          {/* Phone stays visible */}
          {phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" aria-hidden="true" />
              <span>{phone}</span>
            </div>
          )}

          {/* For non-placeholders, keep the original Zip display.
              For placeholders, we intentionally DO NOT show "Zip: 90210"
              since we already show "✓ Located in 90210" above. */}
          {!isPlaceholder && zip && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              <span>Zip: {zip}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

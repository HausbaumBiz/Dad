"use client"

import { useUserZipCode } from "@/hooks/use-user-zipcode"
import { MapPin, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface ZipCodeFilterIndicatorProps {
  businessCount?: number
}

export function ZipCodeFilterIndicator({ businessCount }: ZipCodeFilterIndicatorProps) {
  const { zipCode, hasZipCode } = useUserZipCode()

  if (hasZipCode) {
    return (
      <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
        <div className="flex items-center">
          <MapPin className="h-4 w-4 text-primary mr-2" />
          <p className="text-sm text-primary">
            Showing businesses that service zip code: <strong>{zipCode}</strong>
            {businessCount !== undefined && <span className="ml-2">({businessCount} found)</span>}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
      <div className="flex items-center">
        <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
        <p className="text-sm text-yellow-800">
          No location set.{" "}
          <Link href="/" className="underline font-medium hover:text-yellow-900">
            Set your zip code
          </Link>{" "}
          to see businesses in your area.
        </p>
      </div>
    </div>
  )
}

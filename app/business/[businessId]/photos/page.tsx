"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, ImageIcon } from "lucide-react"

export default function BusinessPhotoAlbumPage() {
  const params = useParams()
  const router = useRouter()
  const businessId = params.businessId as string

  // Placeholder for future implementation
  const [isLoading] = useState(false)

  // Placeholder photos - will be replaced with Cloudflare images in the future
  const placeholderPhotos = [
    { id: 1, title: "Photo 1" },
    { id: 2, title: "Photo 2" },
    { id: 3, title: "Photo 3" },
    { id: 4, title: "Photo 4" },
    { id: 5, title: "Photo 5" },
    { id: 6, title: "Photo 6" },
  ]

  return (
    <div className="container max-w-6xl py-8">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold ml-4">Business Photo Album</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Photo Gallery</CardTitle>
          <CardDescription>Business ID: {businessId}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <p>Loading photos...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {placeholderPhotos.map((photo) => (
                <div key={photo.id} className="aspect-square bg-gray-100 rounded-md flex items-center justify-center">
                  <div className="text-center p-4">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">{photo.title}</p>
                    <p className="text-xs text-gray-400 mt-1">Cloudflare image will appear here</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>This photo album will be populated with Cloudflare images in the future.</p>
            <p className="mt-2">Business ID: {businessId}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

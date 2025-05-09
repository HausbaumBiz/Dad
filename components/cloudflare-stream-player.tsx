"use client"

import { Stream } from "@cloudflare/stream-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CloudflareStreamPlayerProps {
  videoId: string
  aspectRatio?: "16:9" | "9:16"
  title?: string
}

export function CloudflareStreamPlayer({
  videoId,
  aspectRatio = "16:9",
  title = "Your Video",
}: CloudflareStreamPlayerProps) {
  const containerClass = aspectRatio === "16:9" ? "aspect-video w-full" : "aspect-[9/16] w-full max-w-[280px] mx-auto"

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={containerClass}>
          <Stream controls src={videoId} responsive={true} key={videoId} />
        </div>
      </CardContent>
    </Card>
  )
}

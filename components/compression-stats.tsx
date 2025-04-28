"use client"

import { formatFileSize } from "@/lib/media-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownIcon } from "lucide-react"

interface CompressionStatsProps {
  originalSize?: number
  compressedSize?: number
  compressionSavings?: number
  width?: number
  height?: number
}

export function CompressionStats({
  originalSize,
  compressedSize,
  compressionSavings,
  width,
  height,
}: CompressionStatsProps) {
  if (!originalSize || !compressedSize) {
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Compression Results</CardTitle>
        <CardDescription>{width && height ? `${width}×${height}px` : "Image optimization"}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <div className="flex flex-col">
            <span className="text-muted-foreground">Original</span>
            <span className="font-medium">{formatFileSize(originalSize)}</span>
          </div>

          <div className="flex flex-col items-center">
            <ArrowDownIcon className="h-4 w-4 text-green-500" />
            <span className="font-medium text-green-500">
              {compressionSavings ? `${compressionSavings}%` : "Optimized"}
            </span>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-muted-foreground">Compressed</span>
            <span className="font-medium">{formatFileSize(compressedSize)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

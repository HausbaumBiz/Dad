"use client"

import { Progress } from "@/components/ui/progress"

interface UploadProgressProps {
  progress: number
  isUploading: boolean
  error: string | null
}

export function UploadProgress({ progress, isUploading, error }: UploadProgressProps) {
  if (!isUploading && !error) return null

  return (
    <div className="mt-2">
      {isUploading && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-gray-500">Uploading... {progress}%</p>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface VideoSizeWarningProps {
  fileSize: number
  maxSizeMB: number
}

export function VideoSizeWarning({ fileSize, maxSizeMB }: VideoSizeWarningProps) {
  const fileSizeMB = fileSize / (1024 * 1024)
  const isOverLimit = fileSizeMB > maxSizeMB
  const isNearLimit = fileSizeMB > maxSizeMB * 0.8 && !isOverLimit

  if (!isOverLimit && !isNearLimit) {
    return null
  }

  return (
    <Alert variant={isOverLimit ? "destructive" : "warning"} className="mt-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{isOverLimit ? "File too large" : "File size warning"}</AlertTitle>
      <AlertDescription>
        {isOverLimit
          ? `This video is ${fileSizeMB.toFixed(1)}MB, which exceeds the ${maxSizeMB}MB limit. Please select a smaller file.`
          : `This video is ${fileSizeMB.toFixed(1)}MB, which is close to the ${maxSizeMB}MB limit. Upload may fail on slower connections.`}
      </AlertDescription>
    </Alert>
  )
}

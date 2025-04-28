import { AlertCircle } from "lucide-react"

interface FileSizeWarningProps {
  fileType: "video" | "image"
  maxSize: number // in MB
}

export function FileSizeWarning({ fileType, maxSize }: FileSizeWarningProps) {
  return (
    <div className="flex items-center gap-2 text-amber-600 text-sm mt-1">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>
        {fileType === "video"
          ? `Video files must be smaller than ${maxSize}MB. Recommended formats: MP4, WebM.`
          : `Image files must be smaller than ${maxSize}MB. Recommended formats: JPG, PNG.`}
      </span>
    </div>
  )
}

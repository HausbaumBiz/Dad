import { InfoIcon } from "lucide-react"

interface FileSizeWarningProps {
  fileType: "video" | "image"
  maxSize?: number // in MB, now optional
}

export function FileSizeWarning({ fileType, maxSize }: FileSizeWarningProps) {
  return (
    <div className="flex items-center gap-2 text-slate-600 text-sm mt-1">
      <InfoIcon className="h-4 w-4 flex-shrink-0" />
      <span>{fileType === "video" ? `Recommended formats: MP4, WebM.` : `Recommended formats: JPG, PNG.`}</span>
    </div>
  )
}

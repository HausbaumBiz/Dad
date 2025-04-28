import { AlertTriangle } from "lucide-react"

interface FileSizeWarningProps {
  fileType: "video" | "image" | "audio"
  maxSize: number
}

export function FileSizeWarning({ fileType, maxSize }: FileSizeWarningProps) {
  return (
    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md mt-2">
      <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-amber-800">File size limit: {maxSize}MB</p>
        <p className="text-xs text-amber-700 mt-1">
          {fileType === "video" && (
            <>
              Videos larger than {maxSize}MB may fail to upload. For best results, compress your video before uploading.
              Consider using a free online video compressor if your file is too large.
            </>
          )}
          {fileType === "image" && (
            <>
              Images larger than {maxSize}MB may fail to upload. For best results, compress your image before uploading.
            </>
          )}
          {fileType === "audio" && (
            <>
              Audio files larger than {maxSize}MB may fail to upload. For best results, compress your audio before
              uploading.
            </>
          )}
        </p>
      </div>
    </div>
  )
}

import { AlertCircle, CheckCircle } from "lucide-react"

interface FileSizeInfoProps {
  file: File | null
  maxSizeMB: number
  type: "video" | "image"
}

export function FileSizeInfo({ file, maxSizeMB, type }: FileSizeInfoProps) {
  if (!file) return null

  const fileSizeMB = file.size / (1024 * 1024)
  const isOverLimit = fileSizeMB > maxSizeMB

  return (
    <div className={`mt-2 text-sm flex items-center ${isOverLimit ? "text-red-600" : "text-green-600"}`}>
      {isOverLimit ? (
        <>
          <AlertCircle className="mr-1 h-4 w-4" />
          <span>
            Warning: {file.name} ({fileSizeMB.toFixed(2)}MB) exceeds the {maxSizeMB}MB limit.
            {type === "video" ? " Try using a shorter or lower quality video." : " Try using a smaller image."}
          </span>
        </>
      ) : (
        <>
          <CheckCircle className="mr-1 h-4 w-4" />
          <span>
            {file.name} ({fileSizeMB.toFixed(2)}MB)
          </span>
        </>
      )}
    </div>
  )
}

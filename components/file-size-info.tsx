interface FileSizeInfoProps {
  file: File | null
  maxSizeMB: number
  type: "video" | "image"
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// Add a note about compression to 600 KB
export function FileSizeInfo({ file, compressedSize }: { file: File; compressedSize?: number }) {
  return (
    <div className="text-sm text-muted-foreground mt-2">
      <p>Original size: {formatFileSize(file.size)}</p>
      {compressedSize && (
        <p>
          Compressed size: {formatFileSize(compressedSize)} (
          {Math.round(((file.size - compressedSize) / file.size) * 100)}% smaller)
        </p>
      )}
      <p className="text-xs mt-1">
        All images are automatically compressed to less than 600 KB for optimal performance.
      </p>
    </div>
  )
}

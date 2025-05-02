import { Progress } from "@/components/ui/progress"

interface ChunkUploadInfoProps {
  uploadedChunks: number
  totalChunks: number
  progress: number
  isUploading: boolean
}

export function ChunkUploadInfo({ uploadedChunks, totalChunks, progress, isUploading }: ChunkUploadInfoProps) {
  if (!isUploading) return null

  return (
    <div className="space-y-2 mt-4 p-4 border rounded-md bg-muted/20">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Upload Progress:</span>
        <span className="font-medium">{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Chunks:</span>
        <span className="font-medium">
          {uploadedChunks} of {totalChunks} ({((uploadedChunks / totalChunks) * 100).toFixed(0)}%)
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Uploading in chunks allows for larger files and more reliable uploads
      </p>
    </div>
  )
}

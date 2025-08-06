"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getComprehensiveMediaListing, deleteMediaFile, deleteAllBusinessMedia } from "@/app/actions/media-actions"
import { toast } from "@/components/ui/use-toast"
import { Search, Trash2, ImageIcon, Video, FileImage, AlertTriangle, Download, Eye, Play, Clock } from "lucide-react"

interface MediaFile {
  id: string
  url: string
  streamUrl?: string
  thumbnailUrl?: string
  filename: string
  contentType: string
  size: number
  uploadedAt: string
  type: "photo" | "video" | "thumbnail" | "orphaned"
  tags?: string[]
  folderId?: string
  meta?: any
  duration?: number
  status?: string
  readyToStream?: boolean
}

export default function AdminMediaPage() {
  const [businessId, setBusinessId] = useState("")
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [totalFiles, setTotalFiles] = useState(0)
  const [totalSize, setTotalSize] = useState(0)

  const handleSearch = async () => {
    if (!businessId.trim()) {
      toast({
        title: "Business ID required",
        description: "Please enter a business ID to search for media.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await getComprehensiveMediaListing(businessId.trim())

      if (result.success) {
        setMediaFiles(result.mediaFiles || [])
        setTotalFiles(result.totalFiles || 0)
        setTotalSize(result.totalSize || 0)

        if ((result.mediaFiles || []).length === 0) {
          toast({
            title: "No media found",
            description: "No media files found for this business ID.",
          })
        } else {
          const photoCount = result.mediaFiles?.filter((f) => f.type === "photo").length || 0
          const videoCount = result.mediaFiles?.filter((f) => f.type === "video").length || 0
          const thumbnailCount = result.mediaFiles?.filter((f) => f.type === "thumbnail").length || 0
          const orphanedCount = result.mediaFiles?.filter((f) => f.type === "orphaned").length || 0

          toast({
            title: "Media loaded",
            description: `Found ${result.totalFiles} files: ${photoCount} photos, ${videoCount} videos, ${thumbnailCount} thumbnails, ${orphanedCount} orphaned.`,
          })
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load media files.",
          variant: "destructive",
        })
        setMediaFiles([])
        setTotalFiles(0)
        setTotalSize(0)
      }
    } catch (error) {
      console.error("Error searching for media:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
      setMediaFiles([])
      setTotalFiles(0)
      setTotalSize(0)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteFile = async (fileId: string, filename: string, fileType: string) => {
    if (!confirm(`Are you sure you want to delete "${filename}"? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(fileId)
    try {
      const result = await deleteMediaFile(businessId, fileId, fileType)

      if (result.success) {
        // Remove the file from the local state
        setMediaFiles((prev) => prev.filter((file) => file.id !== fileId))
        setTotalFiles((prev) => prev - 1)
        setTotalSize((prev) => {
          const deletedFile = mediaFiles.find((f) => f.id === fileId)
          return prev - (deletedFile?.size || 0)
        })

        toast({
          title: "File deleted",
          description: `"${filename}" has been deleted successfully.`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete the file.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting file:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the file.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const handleDeleteAll = async () => {
    if (!businessId.trim()) {
      toast({
        title: "Business ID required",
        description: "Please enter a business ID to delete media.",
        variant: "destructive",
      })
      return
    }

    if (
      !confirm(`Are you sure you want to delete ALL media for business "${businessId}"? This action cannot be undone.`)
    ) {
      return
    }

    setIsDeletingAll(true)
    try {
      const result = await deleteAllBusinessMedia(businessId)

      if (result.success) {
        setMediaFiles([])
        setTotalFiles(0)
        setTotalSize(0)
        toast({
          title: "All media deleted",
          description: "All media files for this business have been deleted.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete all media files.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting all media:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsDeletingAll(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return "0 Bytes"

    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    if (!dateString) return "Unknown"
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return "Invalid date"
    }
  }

  const formatDuration = (seconds: number): string => {
    if (!seconds || seconds === 0) return "Unknown"

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
    }
  }

  const getFileTypeIcon = (type: string, contentType: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4 text-blue-500" />
      case "thumbnail":
        return <FileImage className="h-4 w-4 text-green-500" />
      case "orphaned":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      default:
        return <ImageIcon className="h-4 w-4 text-purple-500" />
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "video":
        return "bg-blue-100 text-blue-800"
      case "thumbnail":
        return "bg-green-100 text-green-800"
      case "orphaned":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-purple-100 text-purple-800"
    }
  }

  const getVideoStatusBadge = (status: string, readyToStream: boolean) => {
    if (readyToStream) {
      return <Badge className="bg-green-100 text-green-800">Ready</Badge>
    }

    switch (status) {
      case "pendingupload":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Upload</Badge>
      case "downloading":
        return <Badge className="bg-blue-100 text-blue-800">Downloading</Badge>
      case "queued":
        return <Badge className="bg-orange-100 text-orange-800">Queued</Badge>
      case "inprogress":
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
      case "ready":
        return <Badge className="bg-green-100 text-green-800">Ready</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Media Management</h1>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Business Media & Videos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="businessId">Business ID</Label>
              <Input
                id="businessId"
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
                placeholder="Enter business ID (e.g., business:123)"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading} className="min-w-[100px]">
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Section */}
      {totalFiles > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalFiles}</div>
                <div className="text-sm text-gray-500">Total Files</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{formatFileSize(totalSize)}</div>
                <div className="text-sm text-gray-500">Total Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {mediaFiles.filter((f) => f.type === "photo").length}
                </div>
                <div className="text-sm text-gray-500">Photos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {mediaFiles.filter((f) => f.type === "video").length}
                </div>
                <div className="text-sm text-gray-500">Videos</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <Button
                variant="destructive"
                onClick={handleDeleteAll}
                disabled={isDeletingAll}
                className="min-w-[120px]"
              >
                {isDeletingAll ? "Deleting..." : "Delete All Media"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Media Files List */}
      {mediaFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Media Files for Business: {businessId}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mediaFiles.map((file, index) => (
                <div key={file.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getFileTypeIcon(file.type, file.contentType)}
                        <h3 className="font-medium truncate">{file.filename}</h3>
                        <Badge className={getTypeBadgeColor(file.type)}>{file.type}</Badge>
                        {file.type === "video" &&
                          file.status &&
                          getVideoStatusBadge(file.status, file.readyToStream || false)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Type:</span> {file.contentType}
                        </div>
                        <div>
                          <span className="font-medium">Size:</span> {formatFileSize(file.size)}
                        </div>
                        <div>
                          <span className="font-medium">Uploaded:</span> {formatDate(file.uploadedAt)}
                        </div>
                        {file.type === "video" && file.duration && (
                          <div>
                            <span className="font-medium">Duration:</span> {formatDuration(file.duration)}
                          </div>
                        )}
                      </div>

                      {/* Video-specific info */}
                      {file.type === "video" && (
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          {file.streamUrl && (
                            <div>
                              <span className="font-medium">Stream URL: </span>
                              <span className="text-xs text-gray-500 break-all">{file.streamUrl}</span>
                            </div>
                          )}
                          {file.thumbnailUrl && (
                            <div>
                              <span className="font-medium">Thumbnail: </span>
                              <a
                                href={file.thumbnailUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline text-xs"
                              >
                                View Thumbnail
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tags */}
                      {file.tags && file.tags.length > 0 && (
                        <div className="mt-2">
                          <span className="text-sm font-medium text-gray-600">Tags: </span>
                          {file.tags.map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="outline" className="mr-1 text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* File URL */}
                      <div className="mt-2">
                        <span className="text-sm font-medium text-gray-600">URL: </span>
                        <span className="text-xs text-gray-500 break-all">{file.url}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 min-w-[120px]">
                      {file.type === "video" ? (
                        <>
                          {file.streamUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(file.streamUrl, "_blank")}
                              className="w-full"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Play Video
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(file.url, "_blank")}
                            className="w-full"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>

                          {file.thumbnailUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(file.thumbnailUrl, "_blank")}
                              className="w-full"
                            >
                              <ImageIcon className="h-4 w-4 mr-1" />
                              Thumbnail
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(file.url, "_blank")}
                            className="w-full"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement("a")
                              link.href = file.url
                              link.download = file.filename
                              link.target = "_blank"
                              document.body.appendChild(link)
                              link.click()
                              document.body.removeChild(link)
                            }}
                            className="w-full"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </>
                      )}

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteFile(file.id, file.filename, file.type)}
                        disabled={isDeleting === file.id}
                        className="w-full"
                      >
                        {isDeleting === file.id ? (
                          "Deleting..."
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Orphaned file warning */}
                  {file.type === "orphaned" && (
                    <Alert className="mt-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        This file exists in Cloudflare but is not referenced in the business's media records. It may be
                        an orphaned file that can be safely deleted.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Video processing warning */}
                  {file.type === "video" && !file.readyToStream && (
                    <Alert className="mt-3">
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        This video is still being processed by Cloudflare Stream. It may not be ready for playback yet.
                        Status: {file.status}
                      </AlertDescription>
                    </Alert>
                  )}

                  {index < mediaFiles.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && mediaFiles.length === 0 && businessId && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="flex justify-center gap-2 mb-4">
              <ImageIcon className="h-12 w-12 text-gray-400" />
              <Video className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No media files found</h3>
            <p className="text-gray-500">
              No media files or videos were found for business ID:{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">{businessId}</code>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {!businessId && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="flex justify-center gap-2 mb-4">
              <Search className="h-12 w-12 text-gray-400" />
              <Video className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Search for Business Media & Videos</h3>
            <p className="text-gray-500 mb-4">
              Enter a business ID above to view and manage all media files and videos stored for that business.
            </p>
            <div className="text-sm text-gray-400">
              <p>• View and play video files from Cloudflare Stream</p>
              <p>• Download images and view video thumbnails</p>
              <p>• Delete individual files or all files at once</p>
              <p>• See file details including size, type, duration, and upload date</p>
              <p>• Monitor video processing status</p>
              <p>• Identify orphaned files in Cloudflare</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

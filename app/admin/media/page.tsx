"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { listBusinessBlobs, deleteAllBusinessMedia } from "@/app/actions/media-actions"
import { toast } from "@/components/ui/use-toast"
import { LazyImage } from "@/components/lazy-image"
import { LazyVideo } from "@/components/lazy-video"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Grid, List, Eye, Download, ImageIcon, Video, FileIcon } from "lucide-react"

// Note: Image processing is handled server-side via API routes

export default function AdminMediaPage() {
  const [businessId, setBusinessId] = useState("")
  const [blobs, setBlobs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedMedia, setSelectedMedia] = useState<any>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

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
      const result = await listBusinessBlobs(businessId)
      console.log("Search result:", result) // Add debugging

      if (result.success) {
        setBlobs(result.blobs || [])

        if (!result.blobs || result.blobs.length === 0) {
          toast({
            title: "No media found",
            description: "No media files found for this business ID.",
          })
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to list media files.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Search error:", error) // Add error logging
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
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

    if (!confirm("Are you sure you want to delete ALL media for this business? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteAllBusinessMedia(businessId)

      if (result.success) {
        setBlobs([])
        toast({
          title: "Media deleted",
          description: "All media files for this business have been deleted.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete media files.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const openPreview = (blob: any) => {
    setSelectedMedia(blob)
    setIsPreviewOpen(true)
  }

  const isImage = (contentType: string) => {
    return contentType.startsWith("image/")
  }

  const isVideo = (contentType: string) => {
    return contentType.startsWith("video/")
  }

  const getMediaIcon = (contentType: string) => {
    if (isImage(contentType)) return <ImageIcon className="h-6 w-6 text-blue-500" />
    if (isVideo(contentType)) return <Video className="h-6 w-6 text-purple-500" />
    return <FileIcon className="h-6 w-6 text-gray-500" />
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Media Management</h1>

      <Card className="p-6 mb-8">
        <div className="space-y-4">
          <div>
            <Label htmlFor="businessId">Business ID</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="businessId"
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
                placeholder="Enter business ID"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Media Files {blobs.length > 0 ? `(${blobs.length})` : ""}</h2>
              {blobs.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                  >
                    {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteAll} disabled={isDeleting}>
                    {isDeleting ? "Deleting..." : "Delete All Media"}
                  </Button>
                </div>
              )}
            </div>

            {businessId && !isLoading && blobs.length === 0 ? (
              <Card className="p-8">
                <div className="text-center">
                  <FileIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Media Files Found</h3>
                  <p className="text-gray-500 mb-4">
                    No media has been uploaded for business ID: <span className="font-mono">{businessId}</span>
                  </p>
                </div>
              </Card>
            ) : businessId && blobs.length > 0 ? (
              <Tabs defaultValue="gallery" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="gallery">Gallery View</TabsTrigger>
                  <TabsTrigger value="table">Table View</TabsTrigger>
                </TabsList>

                <TabsContent value="gallery">
                  <div
                    className={
                      viewMode === "grid"
                        ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                        : "space-y-2"
                    }
                  >
                    {blobs.map((blob) =>
                      viewMode === "grid" ? (
                        <Card key={blob.url} className="overflow-hidden group relative">
                          <div
                            className="aspect-square relative overflow-hidden bg-gray-100 cursor-pointer"
                            onClick={() => openPreview(blob)}
                          >
                            {isImage(blob.contentType) ? (
                              <LazyImage
                                src={blob.url}
                                alt={blob.pathname.split("/").pop()}
                                className="w-full h-full object-cover"
                              />
                            ) : isVideo(blob.contentType) ? (
                              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                <Video className="h-12 w-12 text-white opacity-70" />
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FileIcon className="h-12 w-12 text-gray-400" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <Button variant="secondary" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <CardContent className="p-2">
                            <div className="truncate text-sm font-medium">{blob.pathname.split("/").pop()}</div>
                            <div className="text-xs text-gray-500">{formatSize(blob.size)}</div>
                          </CardContent>
                        </Card>
                      ) : (
                        <div key={blob.url} className="flex items-center p-2 hover:bg-muted rounded-md">
                          <div className="h-10 w-10 mr-3 flex items-center justify-center">
                            {getMediaIcon(blob.contentType)}
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="truncate text-sm font-medium">{blob.pathname.split("/").pop()}</div>
                            <div className="text-xs text-gray-500">
                              {blob.contentType} • {formatSize(blob.size)}
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => openPreview(blob)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ),
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="table">
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Filename
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Size
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Uploaded
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {blobs.map((blob) => (
                          <tr key={blob.url}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <a
                                href={blob.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                              >
                                {blob.pathname.split("/").pop()}
                              </a>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatSize(blob.size)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{blob.contentType}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(blob.uploadedAt).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <Button variant="ghost" size="sm" onClick={() => openPreview(blob)}>
                                <Eye className="h-4 w-4 mr-1" /> View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>
            ) : null}
          </div>
        </div>
      </Card>

      {/* Media Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Media Preview</DialogTitle>
          </DialogHeader>

          {selectedMedia && (
            <div className="space-y-4">
              <div className="bg-black rounded-lg overflow-hidden flex items-center justify-center min-h-[300px]">
                {isImage(selectedMedia.contentType) ? (
                  <LazyImage
                    src={selectedMedia.url}
                    alt={selectedMedia.pathname.split("/").pop()}
                    className="max-w-full max-h-[500px] object-contain"
                  />
                ) : isVideo(selectedMedia.contentType) ? (
                  <LazyVideo src={selectedMedia.url} className="max-w-full max-h-[500px]" showControls={true} />
                ) : (
                  <div className="text-center p-8">
                    <FileIcon className="h-16 w-16 mx-auto text-gray-400 mb-2" />
                    <p className="text-white">This file type cannot be previewed</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">{selectedMedia.pathname.split("/").pop()}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-500">Type:</div>
                  <div>{selectedMedia.contentType}</div>

                  <div className="text-gray-500">Size:</div>
                  <div>{formatSize(selectedMedia.size)}</div>

                  <div className="text-gray-500">Uploaded:</div>
                  <div>{new Date(selectedMedia.uploadedAt).toLocaleString()}</div>

                  <div className="text-gray-500">URL:</div>
                  <div className="truncate">{selectedMedia.url}</div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => window.open(selectedMedia.url, "_blank")} className="flex-1">
                    <Download className="h-4 w-4 mr-2" /> Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedMedia.url)
                      toast({
                        title: "URL copied",
                        description: "Media URL has been copied to clipboard",
                      })
                    }}
                    className="flex-1"
                  >
                    Copy URL
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Grid, List, Search, Filter, Trash2, Download, ImageIcon, Video, X, Check, Info } from "lucide-react"
import { LazyImage } from "@/components/lazy-image"
import { LazyVideo } from "@/components/lazy-video"
import { MediaUploader } from "@/components/media-uploader"
import { getBusinessMedia, deletePhoto, type MediaItem, type BusinessMedia } from "@/app/actions/media-actions"
import { toast } from "@/components/ui/use-toast"
import { formatFileSize } from "@/lib/media-utils"

interface MediaLibraryProps {
  businessId: string
}

export function MediaLibrary({ businessId }: MediaLibraryProps) {
  // State
  const [media, setMedia] = useState<BusinessMedia | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMediaType, setSelectedMediaType] = useState<"all" | "images" | "videos">("all")
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "name" | "size">("newest")
  const [detailItem, setDetailItem] = useState<MediaItem | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadType, setUploadType] = useState<"photo" | "video" | "thumbnail">("photo")

  // Fetch media on component mount
  useEffect(() => {
    fetchMedia()
  }, [])

  const fetchMedia = async () => {
    setIsLoading(true)
    try {
      const mediaData = await getBusinessMedia(businessId)
      setMedia(mediaData)
    } catch (error) {
      console.error("Error fetching media:", error)
      toast({
        title: "Error",
        description: "Failed to load media library",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle media upload completion
  const handleUploadComplete = (result: any) => {
    if (result && result.success) {
      fetchMedia()
      setIsUploadOpen(false)
      toast({
        title: "Upload complete",
        description: "Your media has been uploaded successfully",
      })
    }
  }

  // Handle media deletion
  const handleDeleteMedia = async (id: string) => {
    try {
      const result = await deletePhoto(businessId, id)
      if (result && result.success) {
        setMedia((prev) => {
          if (!prev) return null
          return { ...prev, photoAlbum: result.photoAlbum }
        })

        // Remove from selected items if present
        if (selectedItems.has(id)) {
          const newSelected = new Set(selectedItems)
          newSelected.delete(id)
          setSelectedItems(newSelected)
        }

        toast({
          title: "Media deleted",
          description: "The selected media has been deleted",
        })
      }
    } catch (error) {
      console.error("Error deleting media:", error)
      toast({
        title: "Error",
        description: "Failed to delete media",
        variant: "destructive",
      })
    }
  }

  // Handle bulk deletion
  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return

    const confirmed = window.confirm(`Are you sure you want to delete ${selectedItems.size} items?`)
    if (!confirmed) return

    let successCount = 0
    let errorCount = 0

    for (const id of selectedItems) {
      try {
        const result = await deletePhoto(businessId, id)
        if (result && result.success) {
          successCount++
          // Update media state after each successful deletion
          setMedia((prev) => {
            if (!prev) return null
            return { ...prev, photoAlbum: result.photoAlbum }
          })
        } else {
          errorCount++
        }
      } catch (error) {
        console.error("Error deleting media:", error)
        errorCount++
      }
    }

    // Clear selected items
    setSelectedItems(new Set())

    if (successCount > 0) {
      toast({
        title: "Bulk deletion complete",
        description: `Successfully deleted ${successCount} items${errorCount > 0 ? `, failed to delete ${errorCount} items` : ""}`,
      })
    } else if (errorCount > 0) {
      toast({
        title: "Bulk deletion failed",
        description: `Failed to delete ${errorCount} items`,
        variant: "destructive",
      })
    }
  }

  // Toggle selection of an item
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedItems(newSelected)
  }

  // Toggle selection of all visible items
  const toggleSelectAll = () => {
    if (selectedItems.size > 0) {
      // If any are selected, clear selection
      setSelectedItems(new Set())
    } else {
      // Otherwise select all visible items
      const newSelected = new Set<string>()
      filteredMedia.forEach((item) => {
        newSelected.add(item.id)
      })
      setSelectedItems(newSelected)
    }
  }

  // Open media detail view
  const openMediaDetail = (item: MediaItem) => {
    setDetailItem(item)
    setIsDetailOpen(true)
  }

  // Filter media based on search and type
  const filteredMedia = (() => {
    if (!media) return []

    let result: MediaItem[] = []

    // Add photos
    if (selectedMediaType === "all" || selectedMediaType === "images") {
      result = [...result, ...(media.photoAlbum || [])]
    }

    // Add video if it exists and matches filter
    if ((selectedMediaType === "all" || selectedMediaType === "videos") && media.videoUrl && media.videoId) {
      result.push({
        id: media.videoId,
        url: media.videoUrl,
        filename: "Video",
        contentType: media.videoContentType || "video/mp4",
        size: 0, // We don't have size info for videos
        createdAt: "", // We don't have creation date for videos
      })
    }

    // Add thumbnail if it exists and matches filter
    if ((selectedMediaType === "all" || selectedMediaType === "images") && media.thumbnailUrl && media.thumbnailId) {
      result.push({
        id: media.thumbnailId,
        url: media.thumbnailUrl,
        filename: "Thumbnail",
        contentType: "image/jpeg", // Assuming JPEG for thumbnails
        size: 0, // We don't have size info for thumbnails
        createdAt: "", // We don't have creation date for thumbnails
      })
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (item) => item.filename.toLowerCase().includes(query) || item.contentType.toLowerCase().includes(query),
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortOrder) {
        case "newest":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        case "oldest":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        case "name":
          return a.filename.localeCompare(b.filename)
        case "size":
          return b.size - a.size
        default:
          return 0
      }
    })

    return result
  })()

  // Determine if an item is a video
  const isVideo = (item: MediaItem) => {
    return item.contentType.startsWith("video/")
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent"></div>
        <p className="mt-2 text-gray-600">Loading media library...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Media Library</h2>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setUploadType("photo")
              setIsUploadOpen(true)
            }}
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            Upload Photo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setUploadType("video")
              setIsUploadOpen(true)
            }}
          >
            <Video className="mr-2 h-4 w-4" />
            Upload Video
          </Button>
        </div>
      </div>

      {/* Search and filter bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search media..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Select value={selectedMediaType} onValueChange={(value: any) => setSelectedMediaType(value)}>
            <SelectTrigger className="w-[130px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Media</SelectItem>
              <SelectItem value="images">Images</SelectItem>
              <SelectItem value="videos">Videos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="size">Size</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
            {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedItems.size > 0 && (
        <div className="flex items-center justify-between bg-muted p-2 rounded-md">
          <div className="flex items-center gap-2">
            <Checkbox checked={selectedItems.size > 0} onCheckedChange={toggleSelectAll} id="select-all" />
            <label htmlFor="select-all" className="text-sm font-medium">
              {selectedItems.size} items selected
            </label>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedItems(new Set())}>
              <X className="mr-2 h-4 w-4" />
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Media grid/list */}
      {filteredMedia.length > 0 ? (
        <div
          className={
            viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" : "space-y-2"
          }
        >
          {filteredMedia.map((item) =>
            viewMode === "grid" ? (
              <Card key={item.id} className="overflow-hidden group relative">
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={() => toggleSelection(item.id)}
                    className="bg-white/80 border-gray-400"
                  />
                </div>

                <div className="aspect-square cursor-pointer" onClick={() => openMediaDetail(item)}>
                  {isVideo(item) ? (
                    <LazyVideo
                      src={item.url}
                      className="w-full h-full object-cover"
                      thumbnailSrc={media?.thumbnailUrl}
                    />
                  ) : (
                    <LazyImage src={item.url} alt={item.filename} className="w-full h-full object-cover" />
                  )}
                </div>

                <CardContent className="p-2">
                  <div className="truncate text-sm font-medium">{item.filename}</div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">
                      {item.size > 0 ? formatFileSize(item.size) : "Unknown size"}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteMedia(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div key={item.id} className="flex items-center p-2 hover:bg-muted rounded-md group">
                <Checkbox
                  checked={selectedItems.has(item.id)}
                  onCheckedChange={() => toggleSelection(item.id)}
                  className="mr-3"
                />

                <div className="h-10 w-10 rounded overflow-hidden mr-3">
                  {isVideo(item) ? (
                    <div className="relative h-full w-full bg-gray-200">
                      <Video className="absolute inset-0 m-auto h-5 w-5 text-gray-500" />
                    </div>
                  ) : (
                    <LazyImage src={item.url} alt={item.filename} className="h-full w-full object-cover" />
                  )}
                </div>

                <div className="flex-grow min-w-0" onClick={() => openMediaDetail(item)}>
                  <div className="truncate text-sm font-medium cursor-pointer">{item.filename}</div>
                  <div className="flex text-xs text-gray-500">
                    <span>{item.contentType}</span>
                    <span className="mx-1">•</span>
                    <span>{item.size > 0 ? formatFileSize(item.size) : "Unknown size"}</span>
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => openMediaDetail(item)}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteMedia(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ),
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No media found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery ? "No media matches your search criteria" : "Upload photos and videos to get started"}
          </p>
          <Button
            onClick={() => {
              setUploadType("photo")
              setIsUploadOpen(true)
            }}
          >
            Upload Media
          </Button>
        </div>
      )}

      {/* Media detail dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Media Details</DialogTitle>
          </DialogHeader>

          {detailItem && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-black rounded-lg overflow-hidden">
                {isVideo(detailItem) ? (
                  <LazyVideo
                    src={detailItem.url}
                    className="w-full h-auto"
                    showControls={true}
                    thumbnailSrc={media?.thumbnailUrl}
                  />
                ) : (
                  <LazyImage src={detailItem.url} alt={detailItem.filename} className="w-full h-auto object-contain" />
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">{detailItem.filename}</h3>

                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">Type</span>
                      <span>{detailItem.contentType}</span>
                    </div>

                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">Size</span>
                      <span>{detailItem.size > 0 ? formatFileSize(detailItem.size) : "Unknown"}</span>
                    </div>

                    {detailItem.createdAt && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-500">Uploaded</span>
                        <span>{new Date(detailItem.createdAt).toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">URL</span>
                      <span className="truncate max-w-[200px]">{detailItem.url}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(detailItem.url, "_blank")}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      navigator.clipboard.writeText(detailItem.url)
                      toast({
                        title: "URL copied",
                        description: "Media URL has been copied to clipboard",
                      })
                    }}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Copy URL
                  </Button>

                  <Button
                    variant="destructive"
                    className="w-full justify-start mt-4"
                    onClick={() => {
                      handleDeleteMedia(detailItem.id)
                      setIsDetailOpen(false)
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {uploadType === "photo" ? "Upload Photo" : uploadType === "video" ? "Upload Video" : "Upload Thumbnail"}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue={uploadType}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="photo" onClick={() => setUploadType("photo")}>
                Photo
              </TabsTrigger>
              <TabsTrigger value="video" onClick={() => setUploadType("video")}>
                Video
              </TabsTrigger>
              <TabsTrigger value="thumbnail" onClick={() => setUploadType("thumbnail")}>
                Thumbnail
              </TabsTrigger>
            </TabsList>

            <TabsContent value="photo">
              <MediaUploader
                businessId={businessId}
                type="photo"
                accept=".jpg,.jpeg,.png,.webp,.gif"
                maxSizeMB={5}
                title="Upload Photo"
                description="Upload photos to your album"
                onUploadComplete={handleUploadComplete}
              />
            </TabsContent>

            <TabsContent value="video">
              <MediaUploader
                businessId={businessId}
                type="video"
                accept=".mp4,.mov,.m4v,.3gp"
                maxSizeMB={50}
                title="Upload Video"
                description="Upload a video to display in your AdBox"
                onUploadComplete={handleUploadComplete}
              />
            </TabsContent>

            <TabsContent value="thumbnail">
              <MediaUploader
                businessId={businessId}
                type="thumbnail"
                accept=".jpg,.jpeg,.png,.webp"
                maxSizeMB={5}
                title="Upload Thumbnail"
                description="Upload a thumbnail image to display before your video plays"
                onUploadComplete={handleUploadComplete}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}

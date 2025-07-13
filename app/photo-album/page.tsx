"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MediaUploader } from "@/components/media-uploader"
import { CloudflareImagesStatus } from "@/components/cloudflare-images-status"
import { ArrowLeft, Upload, ImageIcon, X, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { getCurrentBusiness } from "@/app/actions/business-actions"
import { getBusinessMedia, deletePhoto, type MediaItem, syncCloudflareImages } from "@/app/actions/media-actions"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatFileSize, calculateCompressionSavings } from "@/lib/media-utils"
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Tag,
  GripVertical,
  Save,
  ArrowUp,
  ArrowDown,
  List,
  Grid,
  Trash2,
} from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { useMobile } from "@/hooks/use-mobile"

export default function PhotoAlbumPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [photoAlbum, setPhotoAlbum] = useState<MediaItem[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [photos, setPhotos] = useState<MediaItem[]>([])
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [businessName, setBusinessName] = useState<string>("")
  const [photoDetailOpen, setPhotoDetailOpen] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<MediaItem | null>(null)
  const [photoLabel, setPhotoLabel] = useState<string>("")
  const [isSavingLabel, setIsSavingLabel] = useState(false)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showUploader, setShowUploader] = useState(false)
  const isMobile = useMobile()

  // Load business ID and photo album on component mount
  useEffect(() => {
    async function loadBusiness() {
      try {
        setIsLoading(true)

        // Get the current business from the session
        const business = await getCurrentBusiness()

        if (!business) {
          // If no business is logged in, redirect to login
          toast({
            title: "Authentication required",
            description: "Please log in to access your photo album",
            variant: "destructive",
          })
          router.push("/business-login")
          return
        }

        setBusinessId(business.id)
        console.log(`Loaded business ID: ${business.id}`)
        setBusinessName(business.businessName || "Your Business")

        // Load photo album
        const media = await getBusinessMedia(business.id)
        if (media && media.photoAlbum) {
          const sortedPhotos = [...media.photoAlbum].sort((a, b) => {
            // If both have sortOrder, use it
            if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
              return a.sortOrder - b.sortOrder
            }
            // If only one has sortOrder, the one with sortOrder comes first
            if (a.sortOrder !== undefined) return -1
            if (b.sortOrder !== undefined) return 1
            // If neither has sortOrder, use the default order (by creation date)
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          })
          setPhotoAlbum(sortedPhotos)
          setPhotos(sortedPhotos)
        }
      } catch (error) {
        console.error("Error loading business:", error)
        toast({
          title: "Error loading data",
          description: "There was a problem loading your business information",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadBusiness()
  }, [toast, router])

  // When edit mode is enabled and on mobile, switch to list view automatically
  useEffect(() => {
    if (isEditMode && isMobile) {
      setViewMode("list")
    }
  }, [isEditMode, isMobile])

  const handleUploadComplete = (result: any) => {
    if (result.success && result.photoAlbum) {
      const sortedPhotos = [...result.photoAlbum].sort((a, b) => {
        if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
          return a.sortOrder - b.sortOrder
        }
        return 0
      })
      setPhotoAlbum(sortedPhotos)
      setPhotos(sortedPhotos)
      setShowUploader(false)
      toast({
        title: "Upload successful",
        description: "Your photo has been added to the album",
      })
    }
  }

  const handleSyncCloudflare = async () => {
    if (!businessId) return

    try {
      setIsSyncing(true)
      const result = await syncCloudflareImages(businessId)

      if (result.success) {
        const sortedPhotos = [...result.photoAlbum].sort((a, b) => {
          if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
            return a.sortOrder - b.sortOrder
          }
          return 0
        })
        setPhotoAlbum(sortedPhotos)
        setPhotos(sortedPhotos)
        toast({
          title: "Sync successful",
          description: "Your photo album has been synchronized with Cloudflare Images",
        })
      } else {
        toast({
          title: "Sync failed",
          description: result.error || "Failed to sync with Cloudflare Images",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error syncing with Cloudflare:", error)
      toast({
        title: "Sync error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const removePhoto = async (photoId: string) => {
    if (!businessId) {
      console.error("No business ID available for deletion")
      return
    }

    console.log(`Deleting photo: ${photoId}`)

    try {
      const result = await deletePhoto(businessId, photoId)

      if (result.success) {
        console.log("Delete successful:", result)

        // Update the sortOrder of the remaining photos
        const updatedPhotos = result.photoAlbum.map((photo, index) => ({
          ...photo,
          sortOrder: photo.sortOrder !== undefined ? photo.sortOrder : index,
        }))

        // Sort the photos by sortOrder
        const sortedPhotos = [...updatedPhotos].sort((a, b) => {
          if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
            return a.sortOrder - b.sortOrder
          }
          return 0
        })

        setPhotos(sortedPhotos)
        setPhotoAlbum(sortedPhotos)

        // Save the updated order to Redis
        await updatePhotoInRedis(businessId, sortedPhotos)

        toast({
          title: "Photo deleted",
          description: "The photo has been removed from your album.",
        })
      } else {
        console.error("Delete failed:", result.error)
        toast({
          title: "Delete failed",
          description: result.error || "Failed to delete photo. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting photo:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openPhotoDetail = (photo: MediaItem) => {
    setSelectedPhoto(photo)
    setPhotoLabel(photo.label || "")
    setPhotoDetailOpen(true)
  }

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev === filteredPhotos.length - 1 ? 0 : prev + 1))
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev === 0 ? filteredPhotos.length - 1 : prev - 1))
  }

  // Function to update photo label
  const updatePhotoLabel = async () => {
    if (!businessId || !selectedPhoto) return

    setIsSavingLabel(true)
    try {
      // Create a copy of the photos array
      const updatedPhotos = [...photos]

      // Find the index of the selected photo
      const photoIndex = updatedPhotos.findIndex((photo) => photo.id === selectedPhoto.id)

      if (photoIndex !== -1) {
        // Update the label
        updatedPhotos[photoIndex] = {
          ...updatedPhotos[photoIndex],
          label: photoLabel,
        }

        // Update the state
        setPhotos(updatedPhotos)
        setPhotoAlbum(updatedPhotos)

        // Update in Redis
        await updatePhotoInRedis(businessId, updatedPhotos)

        toast({
          title: "Label updated",
          description: "The photo label has been updated successfully.",
        })
      }
    } catch (error) {
      console.error("Error updating label:", error)
      toast({
        title: "Error",
        description: "Failed to update the photo label. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingLabel(false)
    }
  }

  // Handle drag end event
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const items = Array.from(photos)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update sortOrder for all items
    const updatedItems = items.map((item, index) => ({
      ...item,
      sortOrder: index,
    }))

    setPhotos(updatedItems)
    setPhotoAlbum(updatedItems)

    // Save the new order if not in edit mode
    if (!isEditMode) {
      await savePhotoOrder(updatedItems)
    }
  }

  // Move a photo up in the list
  const movePhotoUp = (index: number) => {
    if (index <= 0) return // Already at the top

    const updatedPhotos = [...photos]
    const temp = updatedPhotos[index]
    updatedPhotos[index] = updatedPhotos[index - 1]
    updatedPhotos[index - 1] = temp

    // Update sortOrder for all items
    const updatedItems = updatedPhotos.map((item, idx) => ({
      ...item,
      sortOrder: idx,
    }))

    setPhotos(updatedItems)
    setPhotoAlbum(updatedItems)
  }

  // Move a photo down in the list
  const movePhotoDown = (index: number) => {
    if (index >= photos.length - 1) return // Already at the bottom

    const updatedPhotos = [...photos]
    const temp = updatedPhotos[index]
    updatedPhotos[index] = updatedPhotos[index + 1]
    updatedPhotos[index + 1] = temp

    // Update sortOrder for all items
    const updatedItems = updatedPhotos.map((item, idx) => ({
      ...item,
      sortOrder: idx,
    }))

    setPhotos(updatedItems)
    setPhotoAlbum(updatedItems)
  }

  // Save the photo order to Redis
  const savePhotoOrder = async (photosToSave = photos) => {
    if (!businessId) return

    setIsSavingOrder(true)
    try {
      await updatePhotoInRedis(businessId, photosToSave)

      toast({
        title: "Order saved",
        description: "The photo order has been updated successfully.",
      })

      // Exit edit mode if we're in it
      if (isEditMode) {
        setIsEditMode(false)
        // Reset to grid view if we're not on mobile
        if (!isMobile) {
          setViewMode("grid")
        }
      }
    } catch (error) {
      console.error("Error saving photo order:", error)
      toast({
        title: "Error",
        description: "Failed to save the photo order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingOrder(false)
    }
  }

  // Helper function to update photos in Redis
  const updatePhotoInRedis = async (businessId: string, updatedPhotos: MediaItem[]) => {
    try {
      // Create a FormData object to use with the server action
      const formData = new FormData()
      formData.append("businessId", businessId)
      formData.append("action", "updatePhotos")
      formData.append("photos", JSON.stringify(updatedPhotos))

      // Use the existing uploadPhoto action as a way to update the Redis store
      // This is a bit of a hack, but it avoids creating a new server action
      const result = await fetch("/api/update-photos", {
        method: "POST",
        body: formData,
      })

      if (!result.ok) {
        throw new Error("Failed to update photos in Redis")
      }

      return await result.json()
    } catch (error) {
      console.error("Error updating photos in Redis:", error)
      throw error
    }
  }

  // No filtering by folders or tags
  const filteredPhotos = photos

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex items-center mb-6">
          <Link href="/workbench" className="mr-4">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Photo Album</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!businessId) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex items-center mb-6">
          <Link href="/workbench" className="mr-4">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Photo Album</h1>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p className="mb-4">You need to be logged in to access your photo album.</p>
              <Button asChild>
                <Link href="/business-login">Log In</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/workbench" className="mr-4">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{businessName}'s Photo Album</h1>
        </div>
      </div>

      {/* Cloudflare Images Status */}
      <div className="mb-6">
        <CloudflareImagesStatus />
      </div>

      {/* Photo Upload */}
      <div className="mb-8">
        {showUploader ? (
          <div className="space-y-4">
            <MediaUploader businessId={businessId} type="photo" onUploadComplete={handleUploadComplete} />
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowUploader(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center p-6 border-2 border-dashed rounded-lg border-gray-300 hover:border-gray-400 transition-colors">
            <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2 text-center">
              <p className="text-sm text-gray-500">Upload images to your photo album</p>
              <p className="text-xs text-gray-400">Supported formats: JPEG, PNG, GIF, WebP</p>
            </div>
            <Button variant="outline" className="mt-4 bg-transparent" onClick={() => setShowUploader(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Photos
            </Button>
          </div>
        )}
      </div>

      {/* Photo Album */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            <div>
              <CardTitle>Your Photos</CardTitle>
              <CardDescription>Manage your business photos</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {photoAlbum.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-2">No photos in your album yet</p>
              <p className="text-sm text-gray-400">Upload photos to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h3 className="text-lg font-medium">All Photos ({filteredPhotos.length})</h3>

                {isEditMode && (
                  <div className="text-sm text-gray-500">
                    {viewMode === "grid" ? (
                      <p>Drag photos to reorder them, then click "Save Order"</p>
                    ) : (
                      <p>Use the arrows to reorder photos, then click "Save Order"</p>
                    )}
                  </div>
                )}
              </div>

              {isEditMode && viewMode === "list" ? renderListView() : renderGridView()}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4 sm:justify-between">
          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {filteredPhotos.length > 0 && (
              <>
                {isEditMode ? (
                  <Button
                    onClick={() => savePhotoOrder()}
                    disabled={isSavingOrder}
                    variant="default"
                    className="w-full sm:w-auto"
                  >
                    {isSavingOrder ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Order
                  </Button>
                ) : (
                  <Button onClick={() => setIsEditMode(true)} variant="outline" className="w-full sm:w-auto">
                    <GripVertical className="mr-2 h-4 w-4" />
                    Reorder Photos
                  </Button>
                )}

                {isEditMode && (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="icon"
                      onClick={() => setViewMode("list")}
                      className="flex-1 sm:flex-none"
                      title="List View"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="icon"
                      onClick={() => setViewMode("grid")}
                      className="flex-1 sm:flex-none"
                      title="Grid View"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}

            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
              <DialogTrigger asChild>
                <Button
                  disabled={filteredPhotos.length === 0}
                  onClick={() => {
                    setCurrentPhotoIndex(0)
                    setIsPreviewOpen(true)
                  }}
                  className="w-full sm:w-auto"
                >
                  Preview Photo Album
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Photo Album Preview</DialogTitle>
                  <DialogDescription>
                    {filteredPhotos.length > 0
                      ? `Photo ${currentPhotoIndex + 1} of ${filteredPhotos.length}`
                      : "No photos to display"}
                  </DialogDescription>
                </DialogHeader>

                {filteredPhotos.length > 0 && (
                  <div className="relative">
                    <div className="flex flex-col justify-center items-center h-[60vh]">
                      <img
                        src={filteredPhotos[currentPhotoIndex].url || "/placeholder.svg"}
                        alt={`Photo ${currentPhotoIndex + 1}`}
                        className="max-h-full max-w-full object-contain"
                      />
                      {filteredPhotos[currentPhotoIndex].label && (
                        <div className="mt-2 text-center">
                          <p className="text-lg font-medium">{filteredPhotos[currentPhotoIndex].label}</p>
                        </div>
                      )}
                    </div>

                    <div className="absolute inset-y-0 left-0 flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={prevPhoto}
                        className="rounded-full bg-black bg-opacity-30 text-white hover:bg-opacity-50"
                      >
                        <ChevronLeft className="h-8 w-8" />
                        <span className="sr-only">Previous photo</span>
                      </Button>
                    </div>

                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={nextPhoto}
                        className="rounded-full bg-black bg-opacity-30 text-white hover:bg-opacity-50"
                      >
                        <ChevronRight className="h-8 w-8" />
                        <span className="sr-only">Next photo</span>
                      </Button>
                    </div>

                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                      {filteredPhotos.map((_, index) => (
                        <button
                          key={index}
                          className={`w-2 h-2 rounded-full ${index === currentPhotoIndex ? "bg-white" : "bg-white/50"}`}
                          onClick={() => setCurrentPhotoIndex(index)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardFooter>
      </Card>

      {/* Photo Detail Dialog */}
      <Dialog open={photoDetailOpen} onOpenChange={setPhotoDetailOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Photo Details</DialogTitle>
          </DialogHeader>

          {selectedPhoto && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-black rounded-lg overflow-hidden">
                <img
                  src={selectedPhoto.url || "/placeholder.svg"}
                  alt={selectedPhoto.filename}
                  className="w-full h-auto object-contain"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">{selectedPhoto.filename}</h3>

                  <div className="space-y-4">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">Size</span>
                      <span>{formatFileSize(selectedPhoto.size)}</span>
                    </div>

                    {selectedPhoto.originalSize && selectedPhoto.originalSize > selectedPhoto.size && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-500">Compression</span>
                        <span className="text-green-600">
                          Saved {formatFileSize(selectedPhoto.originalSize - selectedPhoto.size)} (
                          {calculateCompressionSavings(selectedPhoto.originalSize, selectedPhoto.size).percentage}%)
                        </span>
                      </div>
                    )}

                    {selectedPhoto.createdAt && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-500">Uploaded</span>
                        <span>{new Date(selectedPhoto.createdAt).toLocaleString()}</span>
                      </div>
                    )}

                    {/* Label input field */}
                    <div className="space-y-2">
                      <Label htmlFor="photo-label">Photo Label</Label>
                      <div className="flex gap-2">
                        <Input
                          id="photo-label"
                          value={photoLabel}
                          onChange={(e) => setPhotoLabel(e.target.value)}
                          placeholder="Add a label to this photo"
                          className="flex-1"
                        />
                        <Button onClick={updatePhotoLabel} disabled={isSavingLabel} size="sm">
                          {isSavingLabel ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Tag className="h-4 w-4 mr-2" />
                          )}
                          Save
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Labels will be displayed below the photo in the album view.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="destructive"
                  className="w-full justify-start mt-4"
                  onClick={() => {
                    removePhoto(selectedPhoto.id)
                    setPhotoDetailOpen(false)
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Photo
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )

  function renderGridView() {
    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="photos" direction="vertical">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            >
              {filteredPhotos.map((photo, index) => (
                <Draggable key={photo.id} draggableId={photo.id} index={index} isDragDisabled={!isEditMode}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`relative group w-full ${snapshot.isDragging ? "z-50" : ""}`}
                      style={{
                        ...provided.draggableProps.style,
                        position: snapshot.isDragging ? "fixed" : "relative",
                      }}
                    >
                      <div className="flex flex-col w-full">
                        <div className="relative w-full aspect-square">
                          {isEditMode && (
                            <div
                              {...provided.dragHandleProps}
                              className="absolute top-2 left-2 bg-black bg-opacity-70 rounded-full p-1 text-white z-20 cursor-grab active:cursor-grabbing"
                            >
                              <GripVertical className="h-4 w-4" />
                            </div>
                          )}
                          <img
                            src={photo.url || "/placeholder.svg"}
                            alt={photo.filename}
                            className={`w-full h-full object-cover rounded-md ${isEditMode ? "cursor-move" : "cursor-pointer"}`}
                            onClick={isEditMode ? undefined : () => openPhotoDetail(photo)}
                          />
                          {!isEditMode && (
                            <button
                              onClick={() => removePhoto(photo.id)}
                              className="absolute top-2 right-2 bg-red-500 bg-opacity-80 hover:bg-opacity-100 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <div className="text-xs mt-2 px-1">
                          {photo.label && <p className="font-medium text-sm truncate mb-1">{photo.label}</p>}
                          <p className="truncate text-gray-700">{photo.filename}</p>
                          <p className="text-gray-500 mt-1">
                            {formatFileSize(photo.size)}
                            {photo.originalSize && photo.originalSize > photo.size && (
                              <span className="text-green-600 ml-1">
                                (-{calculateCompressionSavings(photo.originalSize, photo.size).percentage}%)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    )
  }

  function renderListView() {
    return (
      <div className="space-y-2 border rounded-md">
        {filteredPhotos.map((photo, index) => (
          <div key={photo.id} className="flex items-center p-3 border-b last:border-b-0 bg-white hover:bg-gray-50">
            <div className="flex-shrink-0 mr-3">
              <img
                src={photo.url || "/placeholder.svg"}
                alt={photo.filename}
                className="w-16 h-16 object-cover rounded-md"
              />
            </div>

            <div className="flex-grow min-w-0">
              {photo.label && <p className="font-medium text-sm truncate">{photo.label}</p>}
              <p className="text-xs truncate">{photo.filename}</p>
              <p className="text-xs text-gray-500">{formatFileSize(photo.size)}</p>
            </div>

            <div className="flex-shrink-0 flex flex-col gap-1 ml-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => movePhotoUp(index)}
                disabled={index === 0}
                className="h-8 w-8"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => movePhotoDown(index)}
                disabled={index === filteredPhotos.length - 1}
                className="h-8 w-8"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    )
  }
}

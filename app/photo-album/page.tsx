"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { compressImage, formatFileSize, isValidImage, calculateCompressionSavings } from "@/lib/media-utils"
import { useToast } from "@/components/ui/use-toast"
import { ChevronLeft, ChevronRight, Upload, ImageIcon, X, Loader2, Tag, GripVertical, Save } from "lucide-react"
import { uploadPhoto, getBusinessMedia, deletePhoto, type MediaItem } from "@/app/actions/media-actions"
import { getCurrentBusiness } from "@/app/actions/business-actions"
import { Trash2 } from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"

export default function PhotoAlbumPage() {
  const [photos, setPhotos] = useState<MediaItem[]>([])
  const [isCompressing, setIsCompressing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [businessId, setBusinessId] = useState<string>("")
  const [businessName, setBusinessName] = useState<string>("")
  const [photoDetailOpen, setPhotoDetailOpen] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<MediaItem | null>(null)
  const [photoLabel, setPhotoLabel] = useState<string>("")
  const [isSavingLabel, setIsSavingLabel] = useState(false)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Fetch the business ID and existing photos when the component mounts
  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        // Get current business data using the server action
        const businessData = await getCurrentBusiness()

        if (!businessData || !businessData.id) {
          console.error("No business data found:", businessData)
          toast({
            title: "Not logged in",
            description: "Please log in to manage your photo album.",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        console.log("Business data retrieved:", businessData.id)
        setBusinessId(businessData.id)
        setBusinessName(businessData.businessName || "Your Business")

        // Fetch existing photos for this business
        try {
          const mediaData = await getBusinessMedia(businessData.id)
          if (mediaData) {
            if (mediaData.photoAlbum) {
              console.log(`Loaded ${mediaData.photoAlbum.length} photos from storage`)

              // Sort photos by sortOrder if it exists, otherwise use the default order
              const sortedPhotos = [...mediaData.photoAlbum].sort((a, b) => {
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

              setPhotos(sortedPhotos)
            }
          } else {
            console.log("No media data found in storage")
          }
        } catch (mediaError) {
          console.error("Error fetching media data:", mediaError)
          toast({
            title: "Error loading photos",
            description: "Could not load your saved photos. Please try again later.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching business data:", error)
        toast({
          title: "Error loading photos",
          description: "Could not load your saved photos. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusinessData()
  }, [toast])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) {
      console.log("No files selected")
      return
    }

    if (!businessId) {
      console.error("No business ID available")
      toast({
        title: "Error",
        description: "Business ID not found. Please try logging in again.",
        variant: "destructive",
      })
      return
    }

    setIsCompressing(true)
    toast({
      title: "Compressing images",
      description: "Please wait while we optimize your images...",
      duration: 3000,
    })

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      if (!isValidImage(file)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a valid image file.`,
          variant: "destructive",
        })
        continue
      }

      console.log(`Processing file: ${file.name} (${formatFileSize(file.size)})`)

      // Compress the image to target size (600KB = 0.6MB)
      const compressedFile = await compressImage(file, 0.8, 1920)
      console.log(`Compressed to: ${formatFileSize(compressedFile.size)}`)

      // If still over 600KB, try more aggressive compression
      let finalFile = compressedFile
      if (compressedFile.size > 600 * 1024) {
        finalFile = await compressImage(compressedFile, 0.7, 1200)
        console.log(`Further compressed to: ${formatFileSize(finalFile.size)}`)

        // If still over limit, try one final aggressive compression
        if (finalFile.size > 600 * 1024) {
          finalFile = await compressImage(finalFile, 0.6, 1000)
          console.log(`Final compression: ${formatFileSize(finalFile.size)}`)
        }
      }

      // Create FormData for upload
      const formData = new FormData()
      formData.append("businessId", businessId)
      formData.append("photo", finalFile)

      console.log(`Uploading to Blob storage with business ID: ${businessId}`)

      // Upload to Blob storage
      try {
        const result = await uploadPhoto(formData)

        if (result.success) {
          console.log("Upload successful:", result)

          // Add sortOrder to the new photo (place it at the beginning)
          const newPhotoAlbum = result.photoAlbum.map((photo, index) => {
            // If it's the newly added photo (it will be the last one)
            if (index === result.photoAlbum.length - 1) {
              return {
                ...photo,
                sortOrder: 0, // Place it at the beginning
              }
            }
            // Increment the sortOrder of all other photos
            return {
              ...photo,
              sortOrder: (photo.sortOrder !== undefined ? photo.sortOrder : index) + 1,
            }
          })

          // Sort the photos by sortOrder
          const sortedPhotos = [...newPhotoAlbum].sort((a, b) => {
            if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
              return a.sortOrder - b.sortOrder
            }
            return 0
          })

          // Update the photos state
          setPhotos(sortedPhotos)

          // Save the updated order to Redis
          await updatePhotoInRedis(businessId, sortedPhotos)

          toast({
            title: "Image uploaded successfully",
            description: `${file.name} has been added to your album.`,
          })
        } else {
          console.error("Upload failed:", result.error)
          toast({
            title: "Upload failed",
            description: result.error || "Failed to upload image. Please try again.",
            variant: "destructive",
          })
        }
      } catch (uploadError) {
        console.error("Exception during upload:", uploadError)
        toast({
          title: "Upload error",
          description: "An unexpected error occurred during upload.",
          variant: "destructive",
        })
      }
    }

    setIsCompressing(false)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
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

    // Save the new order if not in edit mode
    if (!isEditMode) {
      await savePhotoOrder(updatedItems)
    }
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
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg">Loading your photo album...</p>
        </div>
      </div>
    )
  }

  if (!businessId) {
    return (
      <div className="container mx-auto py-8">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Photo Album</CardTitle>
            <CardDescription>You need to be logged in to manage your photo album.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Button onClick={() => (window.location.href = "/business-login")}>Log In</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">{businessName}'s Photo Album</CardTitle>
          <CardDescription>
            Upload, organize, and manage your photos. Images will be automatically compressed and saved to your account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col items-center p-6 border-2 border-dashed rounded-lg border-gray-300 hover:border-gray-400 transition-colors">
              <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2 text-center">
                <p className="text-sm text-gray-500">Drag and drop your images, or click to browse</p>
                <p className="text-xs text-gray-400">Supported formats: JPEG, PNG, GIF, WebP</p>
              </div>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressing}
              >
                {isCompressing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Compressing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photos
                  </>
                )}
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
              />
            </div>

            {renderPhotoGrid()}
          </div>
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

  function renderPhotoGrid() {
    if (filteredPhotos.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No photos in your album yet. Upload some photos to get started!</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">All Photos ({filteredPhotos.length})</h3>
          {isEditMode && <p className="text-sm text-gray-500">Drag photos to reorder them, then click "Save Order"</p>}
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="photos" direction="horizontal">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
              >
                {filteredPhotos.map((photo, index) => (
                  <Draggable key={photo.id} draggableId={photo.id} index={index} isDragDisabled={!isEditMode}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`relative group ${snapshot.isDragging ? "z-50" : ""}`}
                      >
                        <div className="flex flex-col">
                          <div className="relative">
                            {isEditMode && (
                              <div
                                {...provided.dragHandleProps}
                                className="absolute top-1 left-1 bg-black bg-opacity-50 rounded-full p-1 text-white z-10"
                              >
                                <GripVertical className="h-4 w-4" />
                              </div>
                            )}
                            <img
                              src={photo.url || "/placeholder.svg"}
                              alt={photo.filename}
                              className={`w-full h-32 object-cover rounded-md ${isEditMode ? "cursor-move" : "cursor-pointer"}`}
                              onClick={isEditMode ? undefined : () => openPhotoDetail(photo)}
                            />
                            {!isEditMode && (
                              <button
                                onClick={() => removePhoto(photo.id)}
                                className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>

                          <div className="text-xs mt-1">
                            {photo.label && <p className="font-medium text-sm truncate">{photo.label}</p>}
                            <p className="truncate">{photo.filename}</p>
                            <p className="text-gray-500">
                              {formatFileSize(photo.size)}
                              {photo.originalSize && (
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
      </div>
    )
  }
}

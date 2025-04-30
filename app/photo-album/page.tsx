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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { compressImage, formatFileSize, isValidImage, calculateCompressionSavings } from "@/lib/media-utils"
import { useToast } from "@/components/ui/use-toast"
import { ChevronLeft, ChevronRight, Upload, ImageIcon, X, Loader2, FolderIcon, Tag } from "lucide-react"
import {
  uploadPhoto,
  getBusinessMedia,
  deletePhoto,
  movePhotoToFolder,
  type MediaItem,
  type MediaFolder,
} from "@/app/actions/media-actions"
import { getCurrentBusiness } from "@/app/actions/business-actions"
import { PhotoFolderManager } from "@/components/photo-folder-manager"
import { PhotoTagManager } from "@/components/photo-tag-manager"
import { Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function PhotoAlbumPage() {
  const [photos, setPhotos] = useState<MediaItem[]>([])
  const [folders, setFolders] = useState<MediaFolder[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [isCompressing, setIsCompressing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [businessId, setBusinessId] = useState<string>("")
  const [businessName, setBusinessName] = useState<string>("")
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<string>("all")
  const [photoDetailOpen, setPhotoDetailOpen] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<MediaItem | null>(null)
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
        const mediaData = await getBusinessMedia(businessData.id)
        if (mediaData) {
          if (mediaData.photoAlbum) {
            console.log(`Loaded ${mediaData.photoAlbum.length} photos from storage`)
            setPhotos(mediaData.photoAlbum)
          }

          if (mediaData.folders) {
            console.log(`Loaded ${mediaData.folders.length} folders from storage`)
            setFolders(mediaData.folders)
          }

          if (mediaData.tags) {
            console.log(`Loaded ${mediaData.tags.length} tags from storage`)
            setTags(mediaData.tags)
          }
        } else {
          console.log("No media data found in storage")
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

      // Add folder if we're in a folder
      if (currentFolder) {
        formData.append("folderId", currentFolder)
      }

      // Add selected tags if any
      if (selectedTags.length > 0) {
        formData.append("tags", JSON.stringify(selectedTags))
      }

      console.log(`Uploading to Blob storage with business ID: ${businessId}`)

      // Upload to Blob storage
      try {
        const result = await uploadPhoto(formData)

        if (result.success) {
          console.log("Upload successful:", result)
          // Update the photos state with the new photo album
          setPhotos(result.photoAlbum)

          // Update tags if new ones were added
          if (result.tags) {
            setTags(result.tags)
          }

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
        setPhotos(result.photoAlbum)
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

  const handleMovePhotoToFolder = async (photoId: string, folderId: string | null) => {
    if (!businessId) {
      console.error("No business ID available")
      return
    }

    try {
      const result = await movePhotoToFolder(businessId, photoId, folderId)

      if (result.success) {
        setPhotos(result.photoAlbum)
        setPhotoDetailOpen(false)
        toast({
          title: "Photo moved",
          description: folderId
            ? `Photo moved to ${folders.find((f) => f.id === folderId)?.name || "folder"}`
            : "Photo moved to root",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to move photo.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error moving photo:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  const openPhotoDetail = (photo: MediaItem) => {
    setSelectedPhoto(photo)
    setPhotoDetailOpen(true)
  }

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev === filteredPhotos.length - 1 ? 0 : prev + 1))
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev === 0 ? filteredPhotos.length - 1 : prev - 1))
  }

  // Filter photos based on current folder and selected tags
  const filteredPhotos = photos.filter((photo) => {
    // Filter by folder
    if (activeTab === "folders" && currentFolder) {
      if (photo.folderId !== currentFolder) return false
    }

    // Filter by tags
    if (activeTab === "tags" && selectedTags.length > 0) {
      if (!photo.tags) return false
      return selectedTags.every((tag) => photo.tags?.includes(tag))
    }

    return true
  })

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
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Photos</TabsTrigger>
              <TabsTrigger value="folders">Folders</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
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
            </TabsContent>

            <TabsContent value="folders" className="space-y-6">
              <PhotoFolderManager
                businessId={businessId}
                folders={folders}
                currentFolder={currentFolder}
                onFolderChange={setCurrentFolder}
                onFoldersUpdate={setFolders}
              />

              {currentFolder && (
                <div className="flex flex-col items-center p-6 border-2 border-dashed rounded-lg border-gray-300 hover:border-gray-400 transition-colors">
                  <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
                  <div className="space-y-2 text-center">
                    <p className="text-sm text-gray-500">Upload photos to this folder</p>
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
                </div>
              )}

              {renderPhotoGrid()}
            </TabsContent>

            <TabsContent value="tags" className="space-y-6">
              <PhotoTagManager
                businessId={businessId}
                availableTags={tags}
                selectedTags={selectedTags}
                onTagsUpdate={setTags}
                onSelectedTagsChange={setSelectedTags}
              />

              {renderPhotoGrid()}
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>

          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogTrigger asChild>
              <Button
                disabled={filteredPhotos.length === 0}
                onClick={() => {
                  setCurrentPhotoIndex(0)
                  setIsPreviewOpen(true)
                }}
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
                  <div className="flex justify-center items-center h-[60vh]">
                    <img
                      src={filteredPhotos[currentPhotoIndex].url || "/placeholder.svg"}
                      alt={`Photo ${currentPhotoIndex + 1}`}
                      className="max-h-full max-w-full object-contain"
                    />
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

                  <div className="space-y-2">
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

                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">Folder</span>
                      <span>
                        {selectedPhoto.folderId
                          ? folders.find((f) => f.id === selectedPhoto.folderId)?.name || "Unknown folder"
                          : "None"}
                      </span>
                    </div>

                    <div className="py-2 border-b">
                      <span className="text-gray-500">Tags</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedPhoto.tags && selectedPhoto.tags.length > 0 ? (
                          selectedPhoto.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="px-2 py-1">
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400">No tags</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Move to Folder</h4>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() => handleMovePhotoToFolder(selectedPhoto.id, null)}
                    >
                      <FolderIcon className="h-4 w-4 mr-2" />
                      Root
                    </Button>

                    {folders.map((folder) => (
                      <Button
                        key={folder.id}
                        variant="outline"
                        size="sm"
                        className="justify-start"
                        onClick={() => handleMovePhotoToFolder(selectedPhoto.id, folder.id)}
                      >
                        <FolderIcon className="h-4 w-4 mr-2" />
                        {folder.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Manage Tags</h4>
                  <PhotoTagManager
                    businessId={businessId}
                    availableTags={tags}
                    selectedTags={selectedPhoto.tags || []}
                    photoId={selectedPhoto.id}
                    onTagsUpdate={setTags}
                  />
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

  // Helper function to render the photo grid
  function renderPhotoGrid() {
    return filteredPhotos.length > 0 ? (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">
          {activeTab === "folders" && currentFolder
            ? `Photos in ${folders.find((f) => f.id === currentFolder)?.name || "folder"}`
            : activeTab === "tags" && selectedTags.length > 0
              ? `Photos with ${selectedTags.length === 1 ? "tag" : "tags"}: ${selectedTags.join(", ")}`
              : `All Photos (${filteredPhotos.length})`}
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredPhotos.map((photo) => (
            <div key={photo.id} className="relative group">
              <img
                src={photo.url || "/placeholder.svg"}
                alt={photo.filename}
                className="w-full h-32 object-cover rounded-md cursor-pointer"
                onClick={() => openPhotoDetail(photo)}
              />
              <button
                onClick={() => removePhoto(photo.id)}
                className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Folder and tag indicators */}
              <div className="absolute bottom-1 left-1 flex gap-1">
                {photo.folderId && (
                  <div className="bg-black bg-opacity-50 rounded-full p-1 text-white">
                    <FolderIcon className="h-3 w-3" />
                  </div>
                )}

                {photo.tags && photo.tags.length > 0 && (
                  <div className="bg-black bg-opacity-50 rounded-full p-1 text-white">
                    <Tag className="h-3 w-3" />
                  </div>
                )}
              </div>

              <div className="text-xs mt-1">
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
          ))}
        </div>
      </div>
    ) : (
      <div className="text-center py-8 text-gray-500">
        <p>
          {activeTab === "folders" && currentFolder
            ? "No photos in this folder yet. Upload some photos to get started!"
            : activeTab === "tags" && selectedTags.length > 0
              ? `No photos with ${selectedTags.length === 1 ? "tag" : "all tags"}: ${selectedTags.join(", ")}`
              : "No photos in your album yet. Upload some photos to get started!"}
        </p>
      </div>
    )
  }
}

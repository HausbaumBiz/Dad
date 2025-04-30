"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { X, Plus, Trash2 } from "lucide-react"
import { createTag, deleteTag, addTagsToPhoto, removeTagFromPhoto } from "@/app/actions/media-actions"
import { useToast } from "@/components/ui/use-toast"

interface PhotoTagManagerProps {
  businessId: string
  availableTags: string[]
  selectedTags: string[]
  photoId?: string
  onTagsUpdate: (tags: string[]) => void
  onSelectedTagsChange?: (tags: string[]) => void
}

export function PhotoTagManager({
  businessId,
  availableTags,
  selectedTags,
  photoId,
  onTagsUpdate,
  onSelectedTagsChange,
}: PhotoTagManagerProps) {
  const [newTag, setNewTag] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [tagToDelete, setTagToDelete] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  // Handle tag creation
  const handleCreateTag = async () => {
    if (!newTag.trim()) return

    setIsProcessing(true)
    try {
      const result = await createTag(businessId, newTag.trim())

      if (result.success) {
        onTagsUpdate(result.tags)
        setNewTag("")
        setIsCreateDialogOpen(false)
        toast({
          title: "Tag created",
          description: `Tag "${newTag}" has been created.`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create tag.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating tag:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle tag deletion
  const handleDeleteTag = async () => {
    if (!tagToDelete) return

    setIsProcessing(true)
    try {
      const result = await deleteTag(businessId, tagToDelete)

      if (result.success) {
        onTagsUpdate(result.tags)

        // If the tag was selected, remove it from selected tags
        if (selectedTags.includes(tagToDelete) && onSelectedTagsChange) {
          onSelectedTagsChange(selectedTags.filter((tag) => tag !== tagToDelete))
        }

        setTagToDelete(null)
        setIsDeleteDialogOpen(false)
        toast({
          title: "Tag deleted",
          description: `Tag "${tagToDelete}" has been deleted.`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete tag.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting tag:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle tag selection
  const handleTagSelect = async (tag: string) => {
    // If we're managing tags for a specific photo
    if (photoId) {
      setIsProcessing(true)
      try {
        const result = await addTagsToPhoto(businessId, photoId, [tag])

        if (result.success) {
          // Update both available tags and selected tags
          onTagsUpdate(result.tags)
          if (onSelectedTagsChange) {
            onSelectedTagsChange([...selectedTags, tag])
          }

          toast({
            title: "Tag added",
            description: `Tag "${tag}" has been added to the photo.`,
          })
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to add tag to photo.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error adding tag to photo:", error)
        toast({
          title: "Error",
          description: "An unexpected error occurred.",
          variant: "destructive",
        })
      } finally {
        setIsProcessing(false)
      }
    }
    // If we're just filtering by tags
    else if (onSelectedTagsChange) {
      onSelectedTagsChange([...selectedTags, tag])
    }
  }

  // Handle tag removal
  const handleTagRemove = async (tag: string) => {
    // If we're managing tags for a specific photo
    if (photoId) {
      setIsProcessing(true)
      try {
        const result = await removeTagFromPhoto(businessId, photoId, tag)

        if (result.success) {
          if (onSelectedTagsChange) {
            onSelectedTagsChange(selectedTags.filter((t) => t !== tag))
          }

          toast({
            title: "Tag removed",
            description: `Tag "${tag}" has been removed from the photo.`,
          })
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to remove tag from photo.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error removing tag from photo:", error)
        toast({
          title: "Error",
          description: "An unexpected error occurred.",
          variant: "destructive",
        })
      } finally {
        setIsProcessing(false)
      }
    }
    // If we're just filtering by tags
    else if (onSelectedTagsChange) {
      onSelectedTagsChange(selectedTags.filter((t) => t !== tag))
    }
  }

  // Open delete dialog
  const openDeleteDialog = (tag: string) => {
    setTagToDelete(tag)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Tags</h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => selectedTags.length > 0 && onSelectedTagsChange && onSelectedTagsChange([])}
            disabled={selectedTags.length === 0}
          >
            Clear All
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Tag
          </Button>
        </div>
      </div>

      {/* Selected tags */}
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <Badge key={tag} variant="secondary" className="px-2 py-1">
            {tag}
            <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 -mr-1" onClick={() => handleTagRemove(tag)}>
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}

        {selectedTags.length === 0 && <p className="text-xs text-gray-500">No tags selected</p>}
      </div>

      {/* Available tags */}
      <div>
        <h4 className="text-xs font-medium text-gray-500 mb-2">Available Tags</h4>
        <div className="flex flex-wrap gap-2">
          {availableTags.length > 0 ? (
            availableTags.map((tag) => (
              <div key={tag} className="flex items-center">
                <Badge
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => (selectedTags.includes(tag) ? handleTagRemove(tag) : handleTagSelect(tag))}
                >
                  {tag}
                </Badge>
                <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={() => openDeleteDialog(tag)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500">No tags available</p>
          )}
        </div>
      </div>

      {/* Create tag dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <label htmlFor="tag-name" className="block text-sm font-medium text-gray-700 mb-1">
              Tag Name
            </label>
            <Input
              id="tag-name"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Enter tag name"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleCreateTag} disabled={!newTag.trim() || isProcessing}>
              {isProcessing ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete tag dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-gray-700">Are you sure you want to delete the tag "{tagToDelete}"?</p>
            <p className="text-sm text-gray-500 mt-2">This tag will be removed from all photos.</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTag} disabled={isProcessing}>
              {isProcessing ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

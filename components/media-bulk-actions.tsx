"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Trash2, Download, Tag, FolderPlus, AlertTriangle } from "lucide-react"
import { MediaTags } from "./media-tags"
import { toast } from "@/components/ui/use-toast"

interface MediaBulkActionsProps {
  selectedCount: number
  onDelete: () => Promise<void>
  onDownload: () => void
  onAddToFolder: (folderId: string) => void
  onAddTags: (tags: string[]) => void
  availableTags: string[]
  availableFolders: { id: string; name: string }[]
}

export function MediaBulkActions({
  selectedCount,
  onDelete,
  onDownload,
  onAddToFolder,
  onAddTags,
  availableTags,
  availableFolders,
}: MediaBulkActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete()
      setIsDeleteDialogOpen(false)
      toast({
        title: "Media deleted",
        description: `Successfully deleted ${selectedCount} items`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete media",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddTags = () => {
    if (selectedTags.length > 0) {
      onAddTags(selectedTags)
      setSelectedTags([])
      setIsTagDialogOpen(false)
      toast({
        title: "Tags added",
        description: `Added ${selectedTags.length} tags to ${selectedCount} items`,
      })
    }
  }

  const handleSelectTag = (tag: string) => {
    setSelectedTags((prev) => [...prev, tag])
  }

  const handleRemoveTag = (tag: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag))
  }

  const handleCreateTag = (tag: string) => {
    // In a real app, you would save this to the database
    // For now, we'll just add it to the selected tags
    setSelectedTags((prev) => [...prev, tag])
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDeleteDialogOpen(true)}
          className="flex items-center gap-1"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete</span>
        </Button>

        <Button variant="outline" size="sm" onClick={onDownload} className="flex items-center gap-1">
          <Download className="h-4 w-4" />
          <span>Download</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsTagDialogOpen(true)}
          className="flex items-center gap-1"
        >
          <Tag className="h-4 w-4" />
          <span>Add Tags</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsFolderDialogOpen(true)}
          className="flex items-center gap-1"
        >
          <FolderPlus className="h-4 w-4" />
          <span>Move to Folder</span>
        </Button>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Deletion
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-gray-700">
              Are you sure you want to delete {selectedCount} selected items? This action cannot be undone.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add tags dialog */}
      <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Tags</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-gray-700 mb-4">Add tags to {selectedCount} selected items.</p>

            <MediaTags
              tags={availableTags}
              selectedTags={selectedTags}
              onTagSelect={handleSelectTag}
              onTagRemove={handleRemoveTag}
              onTagCreate={handleCreateTag}
              onTagDelete={() => {}}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTagDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTags} disabled={selectedTags.length === 0}>
              Add Tags
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move to folder dialog */}
      <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Move to Folder</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-gray-700 mb-4">Move {selectedCount} selected items to a folder.</p>

            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {availableFolders.map((folder) => (
                <Button
                  key={folder.id}
                  variant="outline"
                  className="justify-start h-auto py-2"
                  onClick={() => {
                    onAddToFolder(folder.id)
                    setIsFolderDialogOpen(false)
                  }}
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  <span className="truncate">{folder.name}</span>
                </Button>
              ))}

              {availableFolders.length === 0 && (
                <p className="text-sm text-gray-500 col-span-2 text-center py-4">
                  No folders available. Create a folder first.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFolderDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

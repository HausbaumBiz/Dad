"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { FolderIcon, FolderPlus, ChevronRight, MoreHorizontal, Edit, Trash2, ArrowLeft } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createFolder, renameFolder, deleteFolder, type MediaFolder } from "@/app/actions/media-actions"
import { useToast } from "@/components/ui/use-toast"

interface PhotoFolderManagerProps {
  businessId: string
  folders: MediaFolder[]
  currentFolder: string | null
  onFolderChange: (folderId: string | null) => void
  onFoldersUpdate: (folders: MediaFolder[]) => void
}

export function PhotoFolderManager({
  businessId,
  folders,
  currentFolder,
  onFolderChange,
  onFoldersUpdate,
}: PhotoFolderManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [folderToRename, setFolderToRename] = useState<MediaFolder | null>(null)
  const [folderToDelete, setFolderToDelete] = useState<MediaFolder | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  // Get root folders
  const rootFolders = folders.filter((folder) => !folder.parentId)

  // Get child folders of current folder
  const childFolders = currentFolder ? folders.filter((folder) => folder.parentId === currentFolder) : rootFolders

  // Get breadcrumb path
  const getBreadcrumbPath = (folderId: string | null): MediaFolder[] => {
    if (!folderId) return []

    const path: MediaFolder[] = []
    let currentId = folderId

    while (currentId) {
      const folder = folders.find((f) => f.id === currentId)
      if (!folder) break

      path.unshift(folder)
      currentId = folder.parentId || null
    }

    return path
  }

  // Get breadcrumb path for current folder
  const breadcrumbPath = getBreadcrumbPath(currentFolder)

  // Handle folder creation
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    setIsProcessing(true)
    try {
      const result = await createFolder(businessId, newFolderName.trim(), currentFolder || undefined)

      if (result.success) {
        onFoldersUpdate(result.folders)
        setNewFolderName("")
        setIsCreateDialogOpen(false)
        toast({
          title: "Folder created",
          description: `Folder "${newFolderName}" has been created.`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create folder.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating folder:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle folder rename
  const handleRenameFolder = async () => {
    if (!folderToRename || !newFolderName.trim()) return

    setIsProcessing(true)
    try {
      const result = await renameFolder(businessId, folderToRename.id, newFolderName.trim())

      if (result.success) {
        onFoldersUpdate(result.folders)
        setFolderToRename(null)
        setNewFolderName("")
        setIsRenameDialogOpen(false)
        toast({
          title: "Folder renamed",
          description: `Folder has been renamed to "${newFolderName}".`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to rename folder.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error renaming folder:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle folder deletion
  const handleDeleteFolder = async () => {
    if (!folderToDelete) return

    setIsProcessing(true)
    try {
      const result = await deleteFolder(businessId, folderToDelete.id)

      if (result.success) {
        onFoldersUpdate(result.folders)

        // If we're in the folder that was deleted, go back to parent
        if (currentFolder === folderToDelete.id) {
          onFolderChange(folderToDelete.parentId || null)
        }

        setFolderToDelete(null)
        setIsDeleteDialogOpen(false)
        toast({
          title: "Folder deleted",
          description: `Folder "${folderToDelete.name}" has been deleted.`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete folder.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting folder:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Open rename dialog
  const openRenameDialog = (folder: MediaFolder) => {
    setFolderToRename(folder)
    setNewFolderName(folder.name)
    setIsRenameDialogOpen(true)
  }

  // Open delete dialog
  const openDeleteDialog = (folder: MediaFolder) => {
    setFolderToDelete(folder)
    setIsDeleteDialogOpen(true)
  }

  // Go to parent folder
  const goToParentFolder = () => {
    if (breadcrumbPath.length > 0) {
      const currentFolderObj = breadcrumbPath[breadcrumbPath.length - 1]
      onFolderChange(currentFolderObj.parentId || null)
    } else {
      onFolderChange(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb navigation */}
      <div className="flex items-center text-sm overflow-x-auto pb-2">
        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => onFolderChange(null)}>
          <FolderIcon className="h-4 w-4 mr-1" />
          All Photos
        </Button>

        {breadcrumbPath.map((folder, index) => (
          <div key={folder.id} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => onFolderChange(folder.id)}>
              {folder.name}
            </Button>
          </div>
        ))}
      </div>

      {/* Folder actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {currentFolder && (
            <Button variant="outline" size="sm" onClick={goToParentFolder}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          <h3 className="text-lg font-medium">
            {currentFolder ? folders.find((f) => f.id === currentFolder)?.name || "Folder" : "All Folders"}
          </h3>
        </div>
        <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
          <FolderPlus className="h-4 w-4 mr-1" />
          New Folder
        </Button>
      </div>

      {/* Folder grid */}
      {childFolders.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {childFolders.map((folder) => (
            <div
              key={folder.id}
              className="bg-muted rounded-lg p-4 flex flex-col items-center cursor-pointer group relative"
            >
              <div className="flex flex-col items-center" onClick={() => onFolderChange(folder.id)}>
                <FolderIcon className="h-12 w-12 text-blue-500 mb-2" />
                <span className="text-sm font-medium text-center truncate w-full">{folder.name}</span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openRenameDialog(folder)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600" onClick={() => openDeleteDialog(folder)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-muted/30 rounded-lg">
          <FolderIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No folders</h3>
          <p className="text-gray-500 mb-4">
            {currentFolder
              ? "This folder is empty. Create a new folder or upload photos directly to this folder."
              : "You don't have any folders yet. Create a folder to organize your photos."}
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            Create Folder
          </Button>
        </div>
      )}

      {/* Create folder dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <label htmlFor="folder-name" className="block text-sm font-medium text-gray-700 mb-1">
              Folder Name
            </label>
            <Input
              id="folder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter folder name"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim() || isProcessing}>
              {isProcessing ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename folder dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <label htmlFor="rename-folder" className="block text-sm font-medium text-gray-700 mb-1">
              New Name
            </label>
            <Input
              id="rename-folder"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter new folder name"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleRenameFolder} disabled={!newFolderName.trim() || isProcessing}>
              {isProcessing ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete folder dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Folder</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-gray-700">
              Are you sure you want to delete the folder "{folderToDelete?.name}"?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Photos in this folder will not be deleted, but they will be moved out of this folder.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteFolder} disabled={isProcessing}>
              {isProcessing ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

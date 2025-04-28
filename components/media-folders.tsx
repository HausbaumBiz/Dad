"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { FolderIcon, FolderPlus, ChevronRight, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface FolderType {
  id: string
  name: string
  parentId: string | null
}

interface MediaFoldersProps {
  folders: FolderType[]
  currentFolder: string | null
  onFolderChange: (folderId: string | null) => void
  onCreateFolder: (name: string, parentId: string | null) => void
  onRenameFolder: (id: string, name: string) => void
  onDeleteFolder: (id: string) => void
}

export function MediaFolders({
  folders,
  currentFolder,
  onFolderChange,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}: MediaFoldersProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [folderToRename, setFolderToRename] = useState<FolderType | null>(null)

  // Get root folders
  const rootFolders = folders.filter((folder) => folder.parentId === null)

  // Get child folders of current folder
  const childFolders = currentFolder ? folders.filter((folder) => folder.parentId === currentFolder) : rootFolders

  // Get breadcrumb path
  const getBreadcrumbPath = (folderId: string | null): FolderType[] => {
    if (!folderId) return []

    const path: FolderType[] = []
    let currentId = folderId

    while (currentId) {
      const folder = folders.find((f) => f.id === currentId)
      if (!folder) break

      path.unshift(folder)
      currentId = folder.parentId
    }

    return path
  }

  // Get breadcrumb path for current folder
  const breadcrumbPath = getBreadcrumbPath(currentFolder)

  // Handle folder creation
  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), currentFolder)
      setNewFolderName("")
      setIsCreateDialogOpen(false)
    }
  }

  // Handle folder rename
  const handleRenameFolder = () => {
    if (folderToRename && newFolderName.trim()) {
      onRenameFolder(folderToRename.id, newFolderName.trim())
      setFolderToRename(null)
      setNewFolderName("")
      setIsRenameDialogOpen(false)
    }
  }

  // Open rename dialog
  const openRenameDialog = (folder: FolderType) => {
    setFolderToRename(folder)
    setNewFolderName(folder.name)
    setIsRenameDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb navigation */}
      <div className="flex items-center text-sm">
        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => onFolderChange(null)}>
          <FolderIcon className="h-4 w-4 mr-1" />
          All Media
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

      {/* Folder grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
                <DropdownMenuItem className="text-red-600" onClick={() => onDeleteFolder(folder.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}

        {/* Create new folder button */}
        <div
          className="bg-muted/50 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors border-2 border-dashed border-gray-300"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <FolderPlus className="h-12 w-12 text-gray-400 mb-2" />
          <span className="text-sm font-medium text-gray-500">New Folder</span>
        </div>
      </div>

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
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create</Button>
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
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameFolder}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

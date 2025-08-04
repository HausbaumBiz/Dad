"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, UserCheck, UserX, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { deactivateUserAction, reactivateUserAction, deleteUserAction } from "./actions/admin-user-actions"

interface UserActionsCellProps {
  userId: string
  userEmail: string
  status: "active" | "inactive"
}

export function UserActionsCell({ userId, userEmail, status }: UserActionsCellProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDeactivate = async () => {
    setIsLoading(true)
    try {
      const result = await deactivateUserAction(userId)
      if (result.success) {
        toast.success("User deactivated successfully")
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to deactivate user")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReactivate = async () => {
    setIsLoading(true)
    try {
      const result = await reactivateUserAction(userId)
      if (result.success) {
        toast.success("User reactivated successfully")
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to reactivate user")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const result = await deleteUserAction(userId)
      if (result.success) {
        toast.success("User deleted successfully")
        setShowDeleteDialog(false)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to delete user")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {status === "active" ? (
            <DropdownMenuItem onClick={handleDeactivate} disabled={isLoading}>
              <UserX className="mr-2 h-4 w-4" />
              Deactivate Account
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleReactivate} disabled={isLoading}>
              <UserCheck className="mr-2 h-4 w-4" />
              Reactivate Account
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} disabled={isLoading} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account for{" "}
              <strong>{userEmail}</strong> and remove all their data from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isLoading} className="bg-red-600 hover:bg-red-700">
              {isLoading ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

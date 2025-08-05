"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
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
import { MoreHorizontal, UserX, UserCheck, Trash2, Loader2 } from "lucide-react"
import { deleteBusiness } from "@/app/actions/business-actions"
import { deactivateBusinessAccount, reactivateBusinessAccount } from "./actions/admin-business-actions"
import { toast } from "@/components/ui/use-toast"
import type { Business } from "@/lib/definitions"

interface BusinessActionsCellProps {
  business: Business
  onBusinessUpdated: () => void
}

export function BusinessActionsCell({ business, onBusinessUpdated }: BusinessActionsCellProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const handleDeactivate = async () => {
    setIsLoading(true)
    setLoadingAction("deactivate")

    try {
      const result = await deactivateBusinessAccount(business.id)

      if (result.success) {
        toast({
          title: "Business Deactivated",
          description: result.message,
        })
        onBusinessUpdated()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to deactivate business account",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setLoadingAction(null)
    }
  }

  const handleReactivate = async () => {
    setIsLoading(true)
    setLoadingAction("reactivate")

    try {
      const result = await reactivateBusinessAccount(business.id)

      if (result.success) {
        toast({
          title: "Business Reactivated",
          description: result.message,
        })
        onBusinessUpdated()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reactivate business account",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setLoadingAction(null)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    setLoadingAction("delete")

    try {
      const result = await deleteBusiness(business.id)

      if (result.success) {
        toast({
          title: "Business Deleted",
          description: result.message,
        })
        onBusinessUpdated()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete business",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setLoadingAction(null)
      setIsDeleteDialogOpen(false)
    }
  }

  const isActive = business.status === "active"

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
            <span className="sr-only">Open menu</span>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isActive ? (
            <DropdownMenuItem
              onClick={handleDeactivate}
              disabled={isLoading}
              className="text-orange-600 focus:text-orange-600"
            >
              {loadingAction === "deactivate" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserX className="mr-2 h-4 w-4" />
              )}
              Deactivate Account
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={handleReactivate}
              disabled={isLoading}
              className="text-green-600 focus:text-green-600"
            >
              {loadingAction === "reactivate" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserCheck className="mr-2 h-4 w-4" />
              )}
              Reactivate Account
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={isLoading}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the business account for{" "}
              <strong>{business.businessName}</strong> and remove all associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isLoading} className="bg-red-600 hover:bg-red-700">
              {loadingAction === "delete" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Business"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

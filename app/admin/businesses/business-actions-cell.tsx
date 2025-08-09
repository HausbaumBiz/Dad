"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2, Eye } from "lucide-react"
import Link from "next/link"
import { deleteBusiness } from "@/app/actions/business-actions"
import type { Business } from "@/lib/definitions"

interface Props {
  business: Business
  onBusinessUpdated?: () => void
}

export function BusinessActionsCell({ business, onBusinessUpdated }: Props) {
  const [isPending, startTransition] = useTransition()
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleDelete = async () => {
    setDeleting(true)
    setMessage(null)
    startTransition(async () => {
      const res = await deleteBusiness(business.id)
      setDeleting(false)
      setMessage(res.message)
      if (res.success && onBusinessUpdated) {
        onBusinessUpdated()
      }
    })
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Button asChild size="sm" variant="outline">
        <Link href={`/admin/businesses/${business.id}`}>
          <Eye className="h-4 w-4 mr-1" />
          View
        </Link>
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="destructive" disabled={isPending || deleting}>
            <Trash2 className="h-4 w-4 mr-1" />
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this business?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the business and its indexes from Redis. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
          {message && <div className="text-sm text-muted-foreground mt-2">{message}</div>}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

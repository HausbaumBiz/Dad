"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Database, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function MigrateUsersButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleMigration = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/user/migrate", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Migration Successful",
          description: `${data.count} users migrated to the new storage format.`,
          variant: "default",
        })
      } else {
        toast({
          title: "Migration Failed",
          description: data.error || "An error occurred during migration.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Migration Failed",
        description: "An error occurred during migration.",
        variant: "destructive",
      })
      console.error("Migration error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleMigration} disabled={isLoading} variant="outline" size="sm">
      {isLoading ? (
        <>
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Migrating...
        </>
      ) : (
        <>
          <Database className="mr-2 h-4 w-4" />
          Migrate User Storage
        </>
      )}
    </Button>
  )
}

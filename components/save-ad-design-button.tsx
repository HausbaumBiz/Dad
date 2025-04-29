"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { saveAdDesignData } from "@/app/actions/ad-design-actions"
import { useToast } from "@/components/ui/use-toast"
import { Save } from "lucide-react"

interface SaveAdDesignButtonProps {
  formId: string
}

export function SaveAdDesignButton({ formId }: SaveAdDesignButtonProps) {
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleSave = async (formData: FormData) => {
    setIsSaving(true)
    try {
      const result = await saveAdDesignData(formData)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
          variant: "default",
        })
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
        description: "An unexpected error occurred while saving your ad design data.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Button type="submit" form={formId} disabled={isSaving} className="mt-4 w-full" formAction={handleSave}>
      {isSaving ? (
        <span className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          Saving...
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Business Information
        </span>
      )}
    </Button>
  )
}

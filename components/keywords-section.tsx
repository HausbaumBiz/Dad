"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Loader2 } from "lucide-react"
import { saveBusinessKeywords, getBusinessKeywords } from "@/app/actions/keyword-actions"
import { useToast } from "@/components/ui/use-toast"

export function KeywordsSection() {
  const [keywords, setKeywords] = useState<string[]>([])
  const [newKeyword, setNewKeyword] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Load saved keywords on component mount
  useEffect(() => {
    async function loadKeywords() {
      setIsLoading(true)
      try {
        const result = await getBusinessKeywords()
        if (result.success && result.data) {
          setKeywords(result.data)
        }
      } catch (error) {
        console.error("Error loading keywords:", error)
        toast({
          title: "Error",
          description: "Failed to load your saved keywords",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadKeywords()
  }, [])

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return

    // Check if keyword already exists (case insensitive)
    if (keywords.some((kw) => kw.toLowerCase() === newKeyword.trim().toLowerCase())) {
      toast({
        title: "Duplicate keyword",
        description: "This keyword already exists in your list",
        variant: "destructive",
      })
      return
    }

    const updatedKeywords = [...keywords, newKeyword.trim()]
    setKeywords(updatedKeywords)
    setNewKeyword("")
    saveKeywords(updatedKeywords)
  }

  const handleRemoveKeyword = (index: number) => {
    const updatedKeywords = keywords.filter((_, i) => i !== index)
    setKeywords(updatedKeywords)
    saveKeywords(updatedKeywords)
  }

  const saveKeywords = async (keywordsToSave: string[]) => {
    setIsSaving(true)
    try {
      const result = await saveBusinessKeywords(keywordsToSave)
      if (!result.success) {
        throw new Error(result.message || "Failed to save keywords")
      }
    } catch (error) {
      console.error("Error saving keywords:", error)
      toast({
        title: "Error",
        description: "Failed to save your keywords",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mt-12 bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Keywords</h2>
      <div className="text-center text-gray-600 mb-8">
        <p>
          Add keywords that describe your business and services. These will help customers find you when they search.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Loading your keywords...</span>
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-6">
            <Input
              type="text"
              placeholder="Enter a keyword"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddKeyword()
                }
              }}
              className="flex-grow"
            />
            <Button
              onClick={handleAddKeyword}
              disabled={!newKeyword.trim() || isSaving}
              className="flex items-center gap-1"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </Button>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg min-h-[100px]">
            {keywords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1.5 text-sm">
                    {keyword}
                    <button
                      onClick={() => handleRemoveKeyword(index)}
                      className="ml-2 text-gray-500 hover:text-red-500"
                      aria-label={`Remove ${keyword}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No keywords added yet</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

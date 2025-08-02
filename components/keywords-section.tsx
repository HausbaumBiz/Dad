"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, X, Save, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { saveBusinessKeywords, getBusinessKeywords } from "@/app/actions/keyword-actions"

export function KeywordsSection() {
  const { toast } = useToast()
  const [keywords, setKeywords] = useState<string[]>([])
  const [newKeyword, setNewKeyword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Load existing keywords on component mount
  useEffect(() => {
    loadKeywords()
  }, [])

  const loadKeywords = async () => {
    setIsLoading(true)
    try {
      const result = await getBusinessKeywords()
      if (result.success && result.data) {
        setKeywords(result.data)
        console.log("Loaded keywords:", result.data)
      } else {
        console.warn("Failed to load keywords:", result.message)
      }
    } catch (error) {
      console.error("Error loading keywords:", error)
      toast({
        title: "Error",
        description: "Failed to load existing keywords",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addKeyword = () => {
    const trimmedKeyword = newKeyword.trim()

    if (!trimmedKeyword) {
      toast({
        title: "Invalid Keyword",
        description: "Please enter a valid keyword",
        variant: "destructive",
      })
      return
    }

    // Check for duplicates (case-insensitive)
    const isDuplicate = keywords.some((keyword) => keyword.toLowerCase() === trimmedKeyword.toLowerCase())

    if (isDuplicate) {
      toast({
        title: "Duplicate Keyword",
        description: "This keyword already exists",
        variant: "destructive",
      })
      return
    }

    // Add the keyword
    const updatedKeywords = [...keywords, trimmedKeyword]
    setKeywords(updatedKeywords)
    setNewKeyword("")
    setHasChanges(true)

    toast({
      title: "Keyword Added",
      description: `"${trimmedKeyword}" has been added to your keywords`,
    })
  }

  const removeKeyword = (indexToRemove: number) => {
    const keywordToRemove = keywords[indexToRemove]
    const updatedKeywords = keywords.filter((_, index) => index !== indexToRemove)
    setKeywords(updatedKeywords)
    setHasChanges(true)

    toast({
      title: "Keyword Removed",
      description: `"${keywordToRemove}" has been removed from your keywords`,
    })
  }

  const saveKeywords = async () => {
    setIsSaving(true)
    try {
      const result = await saveBusinessKeywords(keywords)

      if (result.success) {
        setHasChanges(false)
        toast({
          title: "Keywords Saved",
          description: result.message || "Your keywords have been saved successfully",
        })
      } else {
        toast({
          title: "Save Failed",
          description: result.message || "Failed to save keywords",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving keywords:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving keywords",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addKeyword()
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Keywords</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading keywords...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Keywords</CardTitle>
        <p className="text-sm text-muted-foreground">
          Add keywords that describe your business, services, or specialties. These help customers find you when they
          search.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new keyword */}
        <div className="flex space-x-2">
          <Input
            placeholder="Enter a keyword (e.g., plumbing, emergency repair, licensed)"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
            maxLength={50}
          />
          <Button onClick={addKeyword} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Display existing keywords */}
        {keywords.length > 0 ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                  <span>{keyword}</span>
                  <button
                    onClick={() => removeKeyword(index)}
                    className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5 transition-colors"
                    aria-label={`Remove ${keyword}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            <div className="text-sm text-muted-foreground">
              {keywords.length} keyword{keywords.length !== 1 ? "s" : ""} added
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No keywords added yet.</p>
            <p className="text-sm">Add keywords to help customers find your business.</p>
          </div>
        )}

        {/* Save button */}
        {hasChanges && (
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={saveKeywords} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Keywords
                </>
              )}
            </Button>
          </div>
        )}

        {/* Tips */}
        <div className="bg-muted/50 rounded-lg p-4 text-sm">
          <h4 className="font-medium mb-2">Tips for effective keywords:</h4>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Use specific services you offer (e.g., "emergency plumbing", "kitchen remodeling")</li>
            <li>• Include your specialties and certifications</li>
            <li>• Think about what customers might search for</li>
            <li>• Use both general and specific terms</li>
            <li>• Keep keywords relevant to your actual services</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Plus, TagIcon } from "lucide-react"

interface MediaTagsProps {
  tags: string[]
  selectedTags: string[]
  onTagSelect: (tag: string) => void
  onTagRemove: (tag: string) => void
  onTagCreate: (tag: string) => void
  onTagDelete: (tag: string) => void
}

export function MediaTags({ tags, selectedTags, onTagSelect, onTagRemove, onTagCreate, onTagDelete }: MediaTagsProps) {
  const [newTag, setNewTag] = useState("")

  const handleCreateTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onTagCreate(newTag.trim())
      setNewTag("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleCreateTag()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Tags</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => selectedTags.forEach((tag) => onTagRemove(tag))}
          disabled={selectedTags.length === 0}
        >
          Clear All
        </Button>
      </div>

      {/* Selected tags */}
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <Badge key={tag} variant="secondary" className="px-2 py-1">
            {tag}
            <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 -mr-1" onClick={() => onTagRemove(tag)}>
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}

        {selectedTags.length === 0 && <p className="text-xs text-gray-500">No tags selected</p>}
      </div>

      {/* Create new tag */}
      <div className="flex gap-2">
        <div className="relative flex-grow">
          <TagIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Add a tag..."
            className="pl-8 h-9 text-sm"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-9"
          onClick={handleCreateTag}
          disabled={!newTag.trim() || tags.includes(newTag.trim())}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Available tags */}
      <div>
        <h4 className="text-xs font-medium text-gray-500 mb-2">Available Tags</h4>
        <div className="flex flex-wrap gap-2">
          {tags.length > 0 ? (
            tags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => (selectedTags.includes(tag) ? onTagRemove(tag) : onTagSelect(tag))}
              >
                {tag}
              </Badge>
            ))
          ) : (
            <p className="text-xs text-gray-500">No tags available</p>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, ImageIcon, FileText, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatFileSize } from "@/lib/media-utils"
import { useToast } from "@/components/ui/use-toast"

interface MediaUploaderProps {
  businessId: string
  type: "photo" | "video" | "thumbnail"
  onUploadComplete?: (result: any) => void
  maxSize?: number // in bytes
  allowedTypes?: string[]
}

export function MediaUploader({
  businessId,
  type,
  onUploadComplete,
  maxSize = 10 * 1024 * 1024, // 10MB default
  allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
}: MediaUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    setError(null)

    if (!selectedFile) {
      return
    }

    // Validate file type
    if (type === "photo" && !allowedTypes.includes(selectedFile.type)) {
      setError(`Invalid file type. Allowed types: ${allowedTypes.join(", ")}`)
      return
    }

    // Validate file size
    if (selectedFile.size > maxSize) {
      setError(`File size exceeds the maximum allowed size (${formatFileSize(maxSize)})`)
      return
    }

    setFile(selectedFile)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    setError(null)
    const droppedFile = e.dataTransfer.files?.[0]

    if (!droppedFile) {
      return
    }

    // Validate file type
    if (type === "photo" && !allowedTypes.includes(droppedFile.type)) {
      setError(`Invalid file type. Allowed types: ${allowedTypes.join(", ")}`)
      return
    }

    // Validate file size
    if (droppedFile.size > maxSize) {
      setError(`File size exceeds the maximum allowed size (${formatFileSize(maxSize)})`)
      return
    }

    setFile(droppedFile)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleUpload = async () => {
    if (!file || !businessId) {
      return
    }

    try {
      setIsUploading(true)
      setProgress(10)

      // Prepare metadata
      const metadata = {
        businessId,
        originalSize: file.size,
        filename: file.name,
      }

      // Step 1: Try to get a direct upload URL from Cloudflare (first method)
      let directUploadResponse = await fetch("/api/cloudflare-images/direct-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metadata,
        }),
      })

      // If the first method fails, try the alternative method
      if (!directUploadResponse.ok) {
        console.log("First direct upload method failed, trying alternative...")
        directUploadResponse = await fetch("/api/cloudflare-images/direct-upload-alt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            metadata,
          }),
        })
      }

      if (!directUploadResponse.ok) {
        const errorData = await directUploadResponse.json()
        throw new Error(errorData.error || "Failed to get upload URL")
      }

      const { uploadURL, id } = await directUploadResponse.json()
      setProgress(30)

      // Step 2: Upload the file directly to Cloudflare
      const formData = new FormData()
      formData.append("file", file)

      const uploadResponse = await fetch(uploadURL, {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        throw new Error(`Upload failed: ${errorText}`)
      }

      setProgress(70)

      // Step 3: Save the image information to our database
      const saveResponse = await fetch("/api/cloudflare-images/save-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId,
          imageId: id,
          filename: file.name,
          contentType: file.type,
          size: file.size,
          originalSize: file.size,
        }),
      })

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json()
        throw new Error(errorData.error || "Failed to save image information")
      }

      setProgress(100)
      const result = await saveResponse.json()

      toast({
        title: "Upload successful",
        description: "Your image has been uploaded successfully.",
      })

      // Call the onUploadComplete callback with the result
      if (onUploadComplete) {
        onUploadComplete(result)
      }

      // Reset the state
      setTimeout(() => {
        setFile(null)
        setProgress(0)
        setIsUploading(false)
      }, 1000)
    } catch (error) {
      console.error("Upload error:", error)
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      setError(errorMessage)
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      })
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!file ? (
        <div
          className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept={type === "photo" ? allowedTypes.join(",") : undefined}
          />
          <div className="flex flex-col items-center text-center">
            <Upload className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-lg font-medium mb-1">
              {type === "photo" ? "Upload Photo" : type === "video" ? "Upload Video" : "Upload Thumbnail"}
            </p>
            <p className="text-sm text-muted-foreground mb-2">Drag and drop or click to select a file</p>
            <p className="text-xs text-muted-foreground">
              Max size: {formatFileSize(maxSize)}
              {type === "photo" && ` • Formats: ${allowedTypes.map((t) => t.split("/")[1]).join(", ")}`}
            </p>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="bg-muted rounded-md p-2 flex-shrink-0">
                {file.type.startsWith("image/") ? (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <FileText className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                {isUploading && <Progress value={progress} className="h-1 mt-2" />}
              </div>
              {!isUploading && (
                <Button variant="ghost" size="icon" onClick={handleCancel} className="flex-shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button onClick={handleUpload} disabled={!file || isUploading} className="flex items-center gap-2">
          {isUploading ? (
            <>
              <span className="animate-pulse">Uploading...</span>
              <span className="text-xs">{progress}%</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-1" />
              Upload
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

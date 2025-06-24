"use server"

import { put } from "@vercel/blob"
import { revalidatePath } from "next/cache"
import { kv } from "@vercel/kv"
import { v4 as uuidv4 } from "uuid"

export type DocumentType = "menu" | "form" | "handout" | "other"

export interface DocumentMetadata {
  id: string
  businessId: string
  name: string
  type: DocumentType
  fileType: string
  url: string
  size: number
  createdAt: number
  updatedAt: number
}

export async function uploadDocument(formData: FormData, businessId: string): Promise<DocumentMetadata | null> {
  try {
    const file = formData.get("file") as File
    const name = formData.get("name") as string
    const type = formData.get("type") as DocumentType

    if (!file || !name || !type) {
      throw new Error("Missing required fields")
    }

    // Validate file type
    const fileType = file.type
    const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/webp"]

    if (!validTypes.includes(fileType)) {
      throw new Error("Invalid file type. Only PDF, JPG, and WEBP files are allowed.")
    }

    // Generate a unique ID for the document
    const id = uuidv4()

    // Create a clean filename (remove special characters)
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")

    // Upload to Vercel Blob with proper content type
    const blob = await put(`documents/${businessId}/${id}-${cleanFileName}`, file, {
      access: "public",
      contentType: fileType, // Ensure proper content type is set
    })

    console.log("File uploaded to Blob storage:", blob.url)

    // Create metadata
    const metadata: DocumentMetadata = {
      id,
      businessId,
      name,
      type,
      fileType,
      url: blob.url,
      size: file.size,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    // Store metadata in KV
    await kv.hset(`business:${businessId}:documents`, {
      [id]: JSON.stringify(metadata),
    })

    // Add to document list by type
    await kv.sadd(`business:${businessId}:documents:${type}`, id)

    // Revalidate the path
    revalidatePath("/custom-button-workbench")

    return metadata
  } catch (error) {
    console.error("Error uploading document:", error)
    return null
  }
}

export async function getBusinessDocuments(businessId: string, type?: DocumentType): Promise<DocumentMetadata[]> {
  try {
    let documentIds: string[] = []

    if (type) {
      // Get documents of specific type
      documentIds = await kv.smembers(`business:${businessId}:documents:${type}`)
    } else {
      // Get all document IDs for this business
      const allDocuments = await kv.hgetall(`business:${businessId}:documents`)
      documentIds = Object.keys(allDocuments || {})
    }

    if (!documentIds.length) return []

    // Get document metadata with better error handling
    const documents: DocumentMetadata[] = []

    for (const id of documentIds) {
      try {
        const data = await kv.hget(`business:${businessId}:documents`, id)

        // Check if data exists
        if (!data) continue

        let document: DocumentMetadata | null = null

        // Handle different data types
        if (typeof data === "string") {
          try {
            document = JSON.parse(data) as DocumentMetadata
          } catch (parseError) {
            console.error(`Error parsing document JSON for ${id}:`, parseError)
            continue
          }
        } else if (typeof data === "object" && data !== null) {
          document = data as DocumentMetadata
        }

        if (document && document.id && document.businessId) {
          documents.push(document)
        }
      } catch (err) {
        console.error(`Error processing document ${id}:`, err)
        continue
      }
    }

    // Sort by creation date (newest first)
    return documents.sort((a, b) => b.createdAt - a.createdAt)
  } catch (error) {
    console.error("Error getting business documents:", error)
    return []
  }
}

export async function deleteDocument(businessId: string, documentId: string): Promise<boolean> {
  try {
    // Get document metadata
    const documentData = await kv.hget(`business:${businessId}:documents`, documentId)

    if (!documentData) {
      throw new Error("Document not found")
    }

    // Parse document data safely
    let document: DocumentMetadata
    if (typeof documentData === "string") {
      document = JSON.parse(documentData) as DocumentMetadata
    } else if (typeof documentData === "object") {
      document = documentData as DocumentMetadata
    } else {
      throw new Error("Invalid document data format")
    }

    // Remove from document list by type
    await kv.srem(`business:${businessId}:documents:${document.type}`, documentId)

    // Remove metadata
    await kv.hdel(`business:${businessId}:documents`, documentId)

    // Note: We're not deleting from Blob storage as it requires additional setup
    // In a production environment, you would want to delete the file from Blob storage as well

    // Revalidate the path
    revalidatePath("/custom-button-workbench")

    return true
  } catch (error) {
    console.error("Error deleting document:", error)
    return false
  }
}

// Add this new function after the deleteDocument function

export async function renameDocument(businessId: string, documentId: string, newName: string): Promise<boolean> {
  try {
    // Get document metadata
    const documentData = await kv.hget(`business:${businessId}:documents`, documentId)

    if (!documentData) {
      throw new Error("Document not found")
    }

    // Parse document data safely
    let document: DocumentMetadata
    if (typeof documentData === "string") {
      document = JSON.parse(documentData) as DocumentMetadata
    } else if (typeof documentData === "object") {
      document = documentData as DocumentMetadata
    } else {
      throw new Error("Invalid document data format")
    }

    // Update the document name
    document.name = newName
    document.updatedAt = Date.now()

    // Save updated metadata
    await kv.hset(`business:${businessId}:documents`, {
      [documentId]: JSON.stringify(document),
    })

    // Revalidate the path
    revalidatePath("/custom-button-workbench")

    return true
  } catch (error) {
    console.error("Error renaming document:", error)
    return false
  }
}

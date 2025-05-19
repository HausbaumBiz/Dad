"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  Upload,
  FileType,
  Printer,
  Download,
  Trash2,
  AlertCircle,
  ArrowLeft,
  Search,
  X,
  FileText,
  MenuIcon,
  ClipboardList,
  File,
  ExternalLink,
  Maximize2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { getCurrentBusiness } from "@/app/actions/business-actions"
import {
  uploadDocument,
  getBusinessDocuments,
  deleteDocument,
  type DocumentMetadata,
  type DocumentType,
} from "@/app/actions/document-actions"
import { Check } from "lucide-react"

export default function CustomButtonWorkbenchPage() {
  const { toast } = useToast()
  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<DocumentMetadata[]>([])
  const [selectedDocument, setSelectedDocument] = useState<DocumentMetadata | null>(null)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<DocumentType | "all">("all")
  const [error, setError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [pdfViewerError, setPdfViewerError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadFormRef = useRef<HTMLFormElement>(null)
  const pdfObjectRef = useRef<HTMLObjectElement>(null)
  const router = useRouter()

  // File upload form state
  const [documentName, setDocumentName] = useState("")
  const [documentType, setDocumentType] = useState<DocumentType>("form")
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    async function fetchBusinessData() {
      try {
        setLoading(true)
        const businessData = await getCurrentBusiness()

        if (!businessData) {
          router.push("/business-login")
          return
        }

        setBusiness(businessData)

        // Load documents
        const docs = await getBusinessDocuments(businessData.id)
        setDocuments(docs)
      } catch (err) {
        console.error("Failed to get business data:", err)
        setError("Failed to load business data. Please try logging in again.")
      } finally {
        setLoading(false)
      }
    }

    fetchBusinessData()
  }, [router])

  // Reset PDF viewer error when selecting a new document
  useEffect(() => {
    setPdfViewerError(false)
  }, [selectedDocument])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = (files: FileList) => {
    const file = files[0]
    const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/webp"]

    if (!validTypes.includes(file.type)) {
      setError("Invalid file type. Only PDF, JPG, and WEBP files are allowed.")
      return
    }

    setSelectedFile(file)
    setError(null)

    // Auto-generate name from filename if not provided
    if (!documentName) {
      const fileName = file.name.split(".")[0]
      setDocumentName(fileName)
    }

    // Show toast notification
    toast({
      title: "File selected",
      description: `${file.name} (${formatFileSize(file.size)})`,
    })
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile) {
      setError("Please select a file to upload")
      return
    }

    try {
      setUploading(true)
      setError(null)

      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("name", documentName)
      formData.append("type", documentType)

      const result = await uploadDocument(formData, business.id)

      if (result) {
        // Add the new document to the list and select it
        setDocuments((prev) => [result, ...prev])
        setSelectedDocument(result)

        // Reset form
        setDocumentName("")
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        if (uploadFormRef.current) {
          uploadFormRef.current.reset()
        }

        // Show success message
        setUploadSuccess(true)
        setTimeout(() => setUploadSuccess(false), 3000)

        // Switch to documents tab to show the uploaded file
        const documentsTab = document.querySelector('[value="documents"]') as HTMLButtonElement
        if (documentsTab) {
          documentsTab.click()
        }

        // Show toast notification
        toast({
          title: "Upload successful",
          description: `${result.name} has been uploaded and is ready to view`,
        })
      } else {
        setError("Failed to upload document. Please try again.")
      }
    } catch (err) {
      console.error("Upload error:", err)
      setError("An error occurred during upload. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (document: DocumentMetadata) => {
    if (window.confirm(`Are you sure you want to delete "${document.name}"?`)) {
      const success = await deleteDocument(business.id, document.id)

      if (success) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== document.id))
        if (selectedDocument?.id === document.id) {
          setSelectedDocument(null)
        }

        // Show toast notification
        toast({
          title: "Document deleted",
          description: `${document.name} has been removed`,
        })
      } else {
        setError("Failed to delete document. Please try again.")
      }
    }
  }

  const handlePrint = () => {
    if (selectedDocument) {
      // Open the document in a new tab
      const printWindow = window.open(selectedDocument.url, "_blank")

      // If the window was successfully opened, try to print
      if (printWindow) {
        // For PDFs, most browsers will show their native print dialog
        // We can also try to trigger print programmatically after a delay
        setTimeout(() => {
          try {
            printWindow.print()
          } catch (err) {
            console.error("Could not automatically print:", err)
            // The user can still use the browser's print function
          }
        }, 1000)
      } else {
        // If popup was blocked, inform the user
        toast({
          title: "Popup Blocked",
          description: "Please allow popups to print documents",
          variant: "destructive",
        })
      }
    }
  }

  const handleDownload = () => {
    if (selectedDocument) {
      const link = document.createElement("a")
      link.href = selectedDocument.url
      link.download = `${selectedDocument.name}.${selectedDocument.fileType.split("/")[1]}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Show toast notification
      toast({
        title: "Download started",
        description: `${selectedDocument.name} is being downloaded`,
      })
    }
  }

  const handleOpenInNewWindow = () => {
    if (selectedDocument) {
      window.open(selectedDocument.url, "_blank")
    }
  }

  const handlePdfError = () => {
    setPdfViewerError(true)
  }

  const filteredDocuments = documents.filter((doc) => {
    // Filter by search term
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase())

    // Filter by type
    const matchesType = activeTab === "all" || doc.type === activeTab

    return matchesSearch && matchesType
  })

  const getDocumentIcon = (fileType: string) => {
    if (fileType.includes("pdf")) {
      return <FileText className="h-6 w-6 text-red-500" />
    } else if (fileType.includes("image")) {
      return <FileType className="h-6 w-6 text-blue-500" />
    } else {
      return <File className="h-6 w-6 text-gray-500" />
    }
  }

  const getDocumentTypeIcon = (type: DocumentType) => {
    switch (type) {
      case "menu":
        return <MenuIcon className="h-4 w-4" />
      case "form":
        return <ClipboardList className="h-4 w-4" />
      case "handout":
        return <FileText className="h-4 w-4" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="mb-6 text-gray-700">{error}</p>
          <Button onClick={() => router.push("/workbench")}>Return to Workbench</Button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <Link
            href="/workbench"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Workbench
          </Link>

          {!loading && business && <div className="text-sm text-gray-500">{business.businessName}</div>}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Document Workbench</h1>
          <p className="text-center text-gray-600 mb-6">Upload, manage, and print your business documents</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Document Preview Section */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              {selectedDocument ? (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      {getDocumentIcon(selectedDocument.fileType)}
                      {selectedDocument.name}
                    </h2>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-1">
                        <Printer className="h-4 w-4" />
                        <span className="hidden sm:inline">Print</span>
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDownload} className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Download</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(selectedDocument)}
                        className="flex items-center gap-1 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-white rounded border border-gray-200 p-2 mb-4">
                    <div className="aspect-[4/3] relative">
                      {selectedDocument.fileType.includes("pdf") ? (
                        pdfViewerError ? (
                          <div className="w-full h-full flex flex-col items-center justify-center">
                            <div className="text-center mb-4">
                              <p className="text-gray-600 mb-2">
                                PDF preview couldn't be loaded in the embedded viewer
                              </p>
                              <div className="flex gap-2 justify-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleOpenInNewWindow}
                                  className="flex items-center gap-1"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  Open PDF
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handlePrint}
                                  className="flex items-center gap-1"
                                >
                                  <Printer className="h-4 w-4" />
                                  Print
                                </Button>
                              </div>
                            </div>
                            <div className="bg-gray-100 rounded p-4 w-full max-w-md text-center">
                              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">{selectedDocument.name}</p>
                              <p className="text-xs text-gray-400 mt-1">{formatFileSize(selectedDocument.size)}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex flex-col">
                            <div className="flex justify-end mb-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleOpenInNewWindow}
                                className="flex items-center gap-1"
                              >
                                <Maximize2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Open Full Screen</span>
                              </Button>
                            </div>
                            <div className="flex-1 relative min-h-[300px]">
                              <object
                                ref={pdfObjectRef}
                                data={`${selectedDocument.url}#toolbar=0`}
                                type="application/pdf"
                                className="w-full h-full absolute inset-0"
                                onError={handlePdfError}
                              >
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                  <p className="text-gray-600 mb-2">
                                    Your browser doesn't support embedded PDF viewing
                                  </p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleOpenInNewWindow}
                                    className="flex items-center gap-1"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    Open PDF
                                  </Button>
                                </div>
                              </object>
                            </div>
                          </div>
                        )
                      ) : (
                        <Image
                          src={selectedDocument.url || "/placeholder.svg"}
                          alt={selectedDocument.name}
                          fill
                          style={{ objectFit: "contain" }}
                          className="rounded"
                          unoptimized // Important for blob storage URLs
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div>
                      <span className="font-medium">Type:</span>{" "}
                      <span className="capitalize">{selectedDocument.type}</span>
                    </div>
                    <div>
                      <span className="font-medium">Format:</span>{" "}
                      {selectedDocument.fileType.split("/")[1].toUpperCase()}
                    </div>
                    <div>
                      <span className="font-medium">Size:</span> {formatFileSize(selectedDocument.size)}
                    </div>
                    <div>
                      <span className="font-medium">Uploaded:</span>{" "}
                      {new Date(selectedDocument.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 flex flex-col items-center justify-center h-full min-h-[400px]">
                  <FileText className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium text-gray-500 mb-2">No Document Selected</h3>
                  <p className="text-gray-400 text-center max-w-md">
                    Select a document from the list or upload a new one to preview, print, or download it.
                  </p>
                </div>
              )}
            </div>

            {/* Upload and Document List Section */}
            <div className="order-1 lg:order-2">
              <Card>
                <CardContent className="p-4">
                  <Tabs defaultValue="documents" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="documents">My Documents</TabsTrigger>
                      <TabsTrigger value="upload">Upload New</TabsTrigger>
                    </TabsList>

                    <TabsContent value="documents" className="mt-0">
                      <div className="mb-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            placeholder="Search documents..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                          />
                          {searchTerm && (
                            <button
                              onClick={() => setSearchTerm("")}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mb-4">
                        <TabsList className="w-full flex overflow-x-auto pb-1 mb-2">
                          <TabsTrigger
                            value="all"
                            onClick={() => setActiveTab("all")}
                            className={activeTab === "all" ? "bg-primary text-primary-foreground" : ""}
                          >
                            All
                          </TabsTrigger>
                          <TabsTrigger
                            value="form"
                            onClick={() => setActiveTab("form")}
                            className={activeTab === "form" ? "bg-primary text-primary-foreground" : ""}
                          >
                            <ClipboardList className="h-4 w-4 mr-1" />
                            Forms
                          </TabsTrigger>
                          <TabsTrigger
                            value="menu"
                            onClick={() => setActiveTab("menu")}
                            className={activeTab === "menu" ? "bg-primary text-primary-foreground" : ""}
                          >
                            <MenuIcon className="h-4 w-4 mr-1" />
                            Menus
                          </TabsTrigger>
                          <TabsTrigger
                            value="handout"
                            onClick={() => setActiveTab("handout")}
                            className={activeTab === "handout" ? "bg-primary text-primary-foreground" : ""}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Handouts
                          </TabsTrigger>
                          <TabsTrigger
                            value="other"
                            onClick={() => setActiveTab("other")}
                            className={activeTab === "other" ? "bg-primary text-primary-foreground" : ""}
                          >
                            Other
                          </TabsTrigger>
                        </TabsList>
                      </div>

                      {loading ? (
                        <div className="space-y-3">
                          {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                          ))}
                        </div>
                      ) : filteredDocuments.length > 0 ? (
                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                          {filteredDocuments.map((doc) => (
                            <div
                              key={doc.id}
                              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                selectedDocument?.id === doc.id
                                  ? "bg-primary/10 border-primary"
                                  : "bg-white border-gray-200 hover:bg-gray-50"
                              }`}
                              onClick={() => setSelectedDocument(doc)}
                            >
                              <div className="flex items-center gap-3">
                                {getDocumentIcon(doc.fileType)}
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-gray-900 truncate">{doc.name}</h3>
                                  <div className="flex items-center text-xs text-gray-500 mt-1">
                                    <span className="flex items-center">
                                      {getDocumentTypeIcon(doc.type)}
                                      <span className="ml-1 capitalize">{doc.type}</span>
                                    </span>
                                    <span className="mx-2">•</span>
                                    <span>{formatFileSize(doc.size)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <h3 className="text-gray-500 font-medium mb-1">No documents found</h3>
                          <p className="text-gray-400 text-sm mb-4">
                            {searchTerm ? "Try a different search term" : "Upload your first document to get started"}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSearchTerm("")
                              setActiveTab("all")
                            }}
                          >
                            Clear filters
                          </Button>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="upload" className="mt-0">
                      <form ref={uploadFormRef} onSubmit={handleUpload}>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="documentName">Document Name</Label>
                            <Input
                              id="documentName"
                              value={documentName}
                              onChange={(e) => setDocumentName(e.target.value)}
                              placeholder="Enter document name"
                              required
                            />
                          </div>

                          <div>
                            <Label>Document Type</Label>
                            <RadioGroup
                              value={documentType}
                              onValueChange={(value) => setDocumentType(value as DocumentType)}
                              className="flex flex-wrap gap-2 mt-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="form" id="form" />
                                <Label htmlFor="form" className="flex items-center gap-1 cursor-pointer">
                                  <ClipboardList className="h-4 w-4" />
                                  Form
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="menu" id="menu" />
                                <Label htmlFor="menu" className="flex items-center gap-1 cursor-pointer">
                                  <MenuIcon className="h-4 w-4" />
                                  Menu
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="handout" id="handout" />
                                <Label htmlFor="handout" className="flex items-center gap-1 cursor-pointer">
                                  <FileText className="h-4 w-4" />
                                  Handout
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="other" id="other" />
                                <Label htmlFor="other" className="flex items-center gap-1 cursor-pointer">
                                  <File className="h-4 w-4" />
                                  Other
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>

                          <div>
                            <Label>Upload File</Label>
                            <div
                              className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center ${
                                dragActive
                                  ? "border-primary bg-primary/5"
                                  : selectedFile
                                    ? "border-green-500 bg-green-50"
                                    : "border-gray-300"
                              }`}
                              onDragEnter={handleDrag}
                              onDragOver={handleDrag}
                              onDragLeave={handleDrag}
                              onDrop={handleDrop}
                            >
                              {selectedFile ? (
                                <>
                                  <div className="flex items-center justify-center mb-2">
                                    {selectedFile.type.includes("pdf") ? (
                                      <FileText className="h-8 w-8 text-red-500" />
                                    ) : (
                                      <FileType className="h-8 w-8 text-blue-500" />
                                    )}
                                  </div>
                                  <p className="text-sm font-medium text-gray-700 mb-1">{selectedFile.name}</p>
                                  <p className="text-xs text-gray-500 mb-2">{formatFileSize(selectedFile.size)}</p>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedFile(null)
                                      if (fileInputRef.current) {
                                        fileInputRef.current.value = ""
                                      }
                                    }}
                                  >
                                    Change File
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                  <p className="text-sm text-gray-600 mb-1">Drag & drop your file here, or</p>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                  >
                                    Browse Files
                                  </Button>
                                </>
                              )}
                              <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.webp"
                                onChange={handleFileChange}
                                required
                              />
                              <p className="text-xs text-gray-400 mt-2">Supported formats: PDF, JPG, WEBP</p>
                            </div>
                          </div>

                          {error && (
                            <div className="flex items-center gap-2 text-red-500 text-sm">
                              <AlertCircle className="h-4 w-4" />
                              {error}
                            </div>
                          )}

                          {uploadSuccess && (
                            <div className="flex items-center gap-2 text-green-500 text-sm">
                              <Check className="h-4 w-4" />
                              Document uploaded successfully!
                            </div>
                          )}

                          <Button type="submit" className="w-full" disabled={uploading || !selectedFile}>
                            {uploading ? "Uploading..." : "Upload Document"}
                          </Button>
                        </div>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, FileType, File, Download, Printer, ExternalLink, Maximize2 } from "lucide-react"
import Image from "next/image"
import { getBusinessDocuments, type DocumentMetadata } from "@/app/actions/document-actions"
import { useToast } from "@/components/ui/use-toast"
import { useMobile } from "@/hooks/use-mobile"

interface DocumentsDialogProps {
  isOpen: boolean
  onClose: () => void
  businessId: string
  businessName: string
}

export function DocumentsDialog({ isOpen, onClose, businessId, businessName }: DocumentsDialogProps) {
  const { toast } = useToast()
  const [documents, setDocuments] = useState<DocumentMetadata[]>([])
  const [selectedDocument, setSelectedDocument] = useState<DocumentMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [pdfViewerError, setPdfViewerError] = useState(false)
  const isMobile = useMobile()

  useEffect(() => {
    if (isOpen) {
      loadDocuments()
    }
  }, [isOpen, businessId])

  // Reset PDF viewer error when selecting a new document
  useEffect(() => {
    setPdfViewerError(false)
  }, [selectedDocument])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const docs = await getBusinessDocuments(businessId)
      setDocuments(docs)

      // Select the first document by default if available (only on desktop)
      if (docs.length > 0 && !isMobile) {
        setSelectedDocument(docs[0])
      } else {
        setSelectedDocument(null)
      }
    } catch (error) {
      console.error("Error loading documents:", error)
      toast({
        title: "Error",
        description: "Failed to load documents. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectDocument = (doc: DocumentMetadata) => {
    if (isMobile) {
      // On mobile, open document directly in a new window
      window.open(doc.url, "_blank")
    } else {
      // On desktop, show in the preview pane
      setSelectedDocument(doc)
    }
  }

  const handlePrint = () => {
    if (selectedDocument) {
      const printWindow = window.open(selectedDocument.url, "_blank")
      if (printWindow) {
        setTimeout(() => {
          try {
            printWindow.print()
          } catch (err) {
            console.error("Could not automatically print:", err)
          }
        }, 1000)
      } else {
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

  const getDocumentIcon = (fileType: string) => {
    if (fileType.includes("pdf")) {
      return <FileText className="h-5 w-5 text-red-500" />
    } else if (fileType.includes("image")) {
      return <FileType className="h-5 w-5 text-blue-500" />
    } else {
      return <File className="h-5 w-5 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  // Render document list view (default on mobile)
  const renderDocumentList = () => (
    <div className={`${isMobile ? "w-full" : "md:col-span-1"} overflow-y-auto border rounded-md p-2 h-full`}>
      <h3 className="font-medium text-sm text-gray-500 mb-3 px-2">Available Documents</h3>

      {loading ? (
        <div className="space-y-3 px-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : documents.length > 0 ? (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedDocument?.id === doc.id && !isMobile
                  ? "bg-primary/10 border-primary"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              }`}
              onClick={() => handleSelectDocument(doc)}
            >
              <div className="flex items-center gap-3">
                {getDocumentIcon(doc.fileType)}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{doc.name}</h3>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <span>{formatFileSize(doc.size)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
          <h3 className="text-gray-500 font-medium mb-1">No documents found</h3>
          <p className="text-gray-400 text-sm">Upload documents in the Document Workbench</p>
        </div>
      )}
    </div>
  )

  // Render document detail view for desktop
  const renderDesktopDocumentDetail = () => {
    if (!selectedDocument) return null

    return (
      <div className="md:col-span-2 h-full flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2 truncate max-w-[70%]">
            {getDocumentIcon(selectedDocument.fileType)}
            <span className="truncate">{selectedDocument.name}</span>
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
          </div>
        </div>

        <div className="bg-white rounded border border-gray-200 p-2 flex-1 overflow-hidden">
          <div className="h-full relative">
            {selectedDocument.fileType.includes("pdf") ? (
              pdfViewerError ? (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div className="text-center mb-4">
                    <p className="text-gray-600 mb-2">PDF preview couldn't be loaded in the embedded viewer</p>
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
                      <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-1">
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
                      data={`${selectedDocument.url}#toolbar=0`}
                      type="application/pdf"
                      className="w-full h-full absolute inset-0"
                      onError={handlePdfError}
                    >
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <p className="text-gray-600 mb-2">Your browser doesn't support embedded PDF viewing</p>
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

        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-3">
          <div>
            <span className="font-medium">Format:</span> {selectedDocument.fileType.split("/")[1].toUpperCase()}
          </div>
          <div>
            <span className="font-medium">Size:</span> {formatFileSize(selectedDocument.size)}
          </div>
          <div>
            <span className="font-medium">Uploaded:</span> {new Date(selectedDocument.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    )
  }

  // Render empty state when no document is selected (desktop only)
  const renderEmptyState = () => (
    <div className="md:col-span-2 h-full flex flex-col">
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 flex flex-col items-center justify-center h-full">
        <FileText className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-medium text-gray-500 mb-2">No Document Selected</h3>
        <p className="text-gray-400 text-center max-w-md">
          {documents.length > 0
            ? "Select a document from the list to preview it"
            : "Upload documents in the Document Workbench to view them here"}
        </p>
      </div>
    </div>
  )

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent
        className="max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden p-0"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        forceMount
      >
        <div className="flex justify-between items-center border-b p-4">
          <DialogTitle className="text-xl font-semibold">
            {isMobile && selectedDocument ? selectedDocument.name : `${businessName} Documents`}
          </DialogTitle>
        </div>

        {isMobile ? (
          <div className="p-4 h-[calc(90vh-8rem)] overflow-hidden">{renderDocumentList()}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 h-[calc(90vh-8rem)] overflow-hidden">
            {renderDocumentList()}
            {selectedDocument ? renderDesktopDocumentDetail() : renderEmptyState()}
          </div>
        )}

        {/* Footer with close button (no X icon) */}
        <div className="border-t p-4 flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { X } from "lucide-react"

/**
 * This component helps troubleshoot dialog close button issues
 * It can be temporarily added to any page to diagnose dialog issues
 */
export function DialogTroubleshooter() {
  const [isOpen, setIsOpen] = useState(false)
  const [closeButtons, setCloseButtons] = useState<Element[]>([])
  const [debugMode, setDebugMode] = useState(false)

  // Function to find and count close buttons
  const findCloseButtons = () => {
    if (typeof window === "undefined") return

    // Wait for DOM to update
    setTimeout(() => {
      // Find all close buttons in the jobs dialog
      const buttons = document.querySelectorAll(
        ".jobs-dialog .radix-dialog-close, .jobs-dialog-content .radix-dialog-close",
      )
      setCloseButtons(Array.from(buttons))

      // Apply debug styling if enabled
      if (debugMode) {
        buttons.forEach((btn, index) => {
          const el = btn as HTMLElement
          el.style.border = "2px solid red"
          el.style.position = "relative"
          el.dataset.closeIndex = `${index + 1}`

          // Add a label to identify each close button
          const label = document.createElement("span")
          label.textContent = `#${index + 1}`
          label.style.position = "absolute"
          label.style.top = "-10px"
          label.style.right = "-10px"
          label.style.backgroundColor = "red"
          label.style.color = "white"
          label.style.borderRadius = "50%"
          label.style.padding = "2px 5px"
          label.style.fontSize = "10px"
          el.appendChild(label)
        })
      }
    }, 500)
  }

  // Toggle debug mode
  const toggleDebugMode = () => {
    const newMode = !debugMode
    setDebugMode(newMode)

    // Apply or remove debug styling
    if (typeof window !== "undefined") {
      const style = document.createElement("style")
      if (newMode) {
        style.id = "dialog-debug-style"
        style.textContent = `
          .jobs-dialog .radix-dialog-close::before {
            display: block !important;
          }
        `
        document.head.appendChild(style)
      } else {
        const existingStyle = document.getElementById("dialog-debug-style")
        if (existingStyle) existingStyle.remove()
      }
    }
  }

  // Fix duplicate close buttons
  const fixDuplicateButtons = () => {
    if (typeof window === "undefined") return

    const buttons = document.querySelectorAll(
      ".jobs-dialog .radix-dialog-close, .jobs-dialog-content .radix-dialog-close",
    )

    // Keep only the first close button
    buttons.forEach((btn, index) => {
      if (index > 0) {
        const el = btn as HTMLElement
        el.style.display = "none"
      }
    })

    // Recount buttons
    findCloseButtons()
  }

  useEffect(() => {
    if (isOpen) {
      findCloseButtons()
    }
  }, [isOpen])

  return (
    <div className="p-4 border rounded-md bg-gray-50 mb-4">
      <h3 className="text-lg font-medium mb-2">Dialog Troubleshooter</h3>

      <div className="flex flex-wrap gap-2 mb-4">
        <Button onClick={() => setIsOpen(true)} variant="outline">
          Open Test Dialog
        </Button>

        <Button onClick={toggleDebugMode} variant={debugMode ? "default" : "outline"}>
          {debugMode ? "Disable Debug Mode" : "Enable Debug Mode"}
        </Button>

        <Button onClick={findCloseButtons} variant="outline">
          Count Close Buttons
        </Button>

        <Button onClick={fixDuplicateButtons} variant="outline">
          Fix Duplicate Buttons
        </Button>
      </div>

      <div className="text-sm">
        <p>
          Close buttons found: <strong>{closeButtons.length}</strong>
        </p>
        {closeButtons.length > 1 && (
          <p className="text-red-500 font-medium">⚠️ Multiple close buttons detected! This may cause UI issues.</p>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="jobs-dialog jobs-dialog-content" closeButton={false}>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogHeader>

          <div className="absolute right-1 top-1 z-10">
            <DialogClose className="rounded-full p-1 bg-white hover:bg-gray-100 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none dialog-close-button">
              <X className="h-3 w-3" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>

          <div className="p-4">
            <p>This is a test dialog to troubleshoot close button issues.</p>
            <p className="text-sm text-gray-500 mt-2">
              If you see multiple close buttons, the issue needs to be fixed.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

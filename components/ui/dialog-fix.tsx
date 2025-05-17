"use client"

import { useEffect } from "react"

export function DialogOverlayFix() {
  useEffect(() => {
    // Function to handle dialog open/close
    const handleDialogState = () => {
      // Find all open dialogs
      const openDialogs = document.querySelectorAll('[role="dialog"]')

      if (openDialogs.length > 0) {
        // If any dialog is open, prevent body scrolling
        document.body.style.overflow = "hidden"
        document.body.style.position = "fixed"
        document.body.style.width = "100%"
        document.body.style.touchAction = "none"
      } else {
        // If no dialogs are open, restore body scrolling
        document.body.style.overflow = ""
        document.body.style.position = ""
        document.body.style.width = ""
        document.body.style.touchAction = ""
      }
    }

    // Create a MutationObserver to watch for dialog changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList" || mutation.type === "attributes") {
          handleDialogState()
        }
      }
    })

    // Start observing the document body
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state"],
    })

    // Initial check
    handleDialogState()

    // Cleanup
    return () => {
      observer.disconnect()
      document.body.style.overflow = ""
      document.body.style.position = ""
      document.body.style.width = ""
      document.body.style.touchAction = ""
    }
  }, [])

  return null
}

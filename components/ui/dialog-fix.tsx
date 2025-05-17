"use client"

import { useEffect } from "react"

/**
 * This component adds a global fix for dialog overlays to prevent horizontal scrolling
 * It should be added to the layout.tsx file
 */
export function DialogOverlayFix() {
  useEffect(() => {
    // Function to add the overlay fix class
    const addOverlayFix = () => {
      // Find all dialog overlays
      const overlays = document.querySelectorAll("[data-radix-portal]")

      overlays.forEach((overlay) => {
        // Add the fix class
        overlay.classList.add("dialog-overlay-fix")
      })
    }

    // Create a mutation observer to watch for dialog overlays being added to the DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          addOverlayFix()
        }
      })
    })

    // Start observing the body for changes
    observer.observe(document.body, { childList: true, subtree: true })

    // Add the initial fix
    addOverlayFix()

    // Add the CSS for the fix
    const style = document.createElement("style")
    style.textContent = `
      .dialog-overlay-fix {
        max-width: 100vw !important;
        width: 100vw !important;
        overflow-x: hidden !important;
        left: 0 !important;
        right: 0 !important;
        position: fixed !important;
      }
    `
    document.head.appendChild(style)

    // Cleanup
    return () => {
      observer.disconnect()
      document.head.removeChild(style)
    }
  }, [])

  return null
}

"use client"

import { useEffect } from "react"

export function DialogFix() {
  useEffect(() => {
    // Create a style element for our fix
    const styleEl = document.createElement("style")
    styleEl.id = "global-dialog-fix"

    // Target the specific button that's causing problems
    const cssRule = `
      /* Target the specific duplicate close button in jobs dialog */
      .jobs-dialog-content .rounded-full.p-1\\.5.bg-gray-100 {
        display: none !important;
      }
      
      /* General rule to prevent duplicate close buttons in all dialogs */
      [role="dialog"] [data-radix-collection-item]:not(:first-of-type),
      [role="dialog"] button[type="button"].rounded-full:not(:first-of-type),
      [role="dialog"] button[aria-label="Close"]:not(:first-of-type) {
        display: none !important;
      }
    `

    styleEl.textContent = cssRule
    document.head.appendChild(styleEl)

    console.log("✅ Global dialog fix applied")

    return () => {
      // Clean up if component unmounts
      if (document.getElementById("global-dialog-fix")) {
        document.getElementById("global-dialog-fix")?.remove()
      }
    }
  }, [])

  // This component doesn't render anything visible
  return null
}

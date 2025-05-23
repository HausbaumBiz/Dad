"use client"

import { fixCategoryPageMappings } from "@/lib/category-page-mappings"

async function FixCategoryPageMappingsPage() {
  async function handleFixCategoryPageMappings() {
    try {
      const result = await fixCategoryPageMappings()
      alert(`Successfully fixed category page mappings. Result: ${JSON.stringify(result)}`)
    } catch (error: any) {
      console.error("Error fixing category page mappings:", error)
      alert(`Error fixing category page mappings: ${error.message}`)
    }
  }

  return (
    <div>
      <h1>Fix Category Page Mappings</h1>
      <p>This page allows you to fix category page mappings.</p>
      <button onClick={handleFixCategoryPageMappings}>Fix Category Page Mappings</button>
    </div>
  )
}

export default FixCategoryPageMappingsPage

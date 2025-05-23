import { Suspense } from "react"
import RebuildPageMappingsClient from "./rebuild-page-mappings-client"

export default function RebuildPageMappingsPage() {
  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={<div>Loading...</div>}>
        <RebuildPageMappingsClient />
      </Suspense>
    </div>
  )
}

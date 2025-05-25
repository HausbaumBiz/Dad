import { Suspense } from "react"
import { RedisStructureViewer } from "./redis-structure-viewer"

export default function RedisStructurePage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Redis Structure Viewer</h1>
        <p className="text-gray-600 mt-2">Explore the Redis data structure for any business in the system</p>
      </div>

      <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
        <RedisStructureViewer />
      </Suspense>
    </div>
  )
}

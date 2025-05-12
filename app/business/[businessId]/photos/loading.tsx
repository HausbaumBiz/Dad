import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="container max-w-6xl py-8">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10"></div>
        <h1 className="text-2xl font-bold ml-4">Business Photo Album</h1>
      </div>

      <div className="flex justify-center items-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading photo album...</span>
      </div>
    </div>
  )
}

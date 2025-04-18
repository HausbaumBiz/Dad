import { Loader2 } from "lucide-react"

export default function GlobalLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

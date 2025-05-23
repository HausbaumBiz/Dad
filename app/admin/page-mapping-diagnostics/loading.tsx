export default function Loading() {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-4">
          <div className="h-32 bg-gray-100 rounded animate-pulse" />
          <div className="h-48 bg-gray-100 rounded animate-pulse" />
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}

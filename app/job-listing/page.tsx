import Link from "next/link"

export default function JobListingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Create A Job Listing</h1>
          <Link
            href="/workbench"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors text-gray-700"
          >
            Back to Workbench
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <p className="text-lg text-gray-600 text-center">Job Listing page is under construction. Check back soon!</p>
        </div>
      </div>
    </div>
  )
}

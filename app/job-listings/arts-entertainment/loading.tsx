import { Skeleton } from "@/components/ui/skeleton"

export default function ArtsEntertainmentJobsLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-16 w-48" />
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />

        <div className="rounded-xl mb-10 bg-gray-200">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="text-center">
              <Skeleton className="h-16 w-16 mx-auto mb-4 rounded-full" />
              <Skeleton className="h-12 w-64 mx-auto mb-4" />
              <Skeleton className="h-6 w-96 mx-auto" />
            </div>
          </div>
        </div>

        <div className="max-w-xl mx-auto mb-10">
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>

        <div className="text-center py-12">
          <Skeleton className="h-64 w-80 mx-auto rounded-lg" />
        </div>
      </main>

      <footer className="bg-gray-800 py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-16 w-32" />
        </div>
      </footer>
    </div>
  )
}

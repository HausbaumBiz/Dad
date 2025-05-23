import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto py-8">
      <Skeleton className="h-10 w-64 mb-6" />
      <Skeleton className="h-[500px] w-full rounded-lg" />
    </div>
  )
}

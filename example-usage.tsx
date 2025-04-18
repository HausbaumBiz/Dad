import { OptimizedImage } from "@/components/optimized-image"
import { ResponsivePicture } from "@/components/responsive-picture"
import { LazyImage } from "@/components/lazy-image"

export default function ExamplePage() {
  return (
    <div className="space-y-8">
      {/* Hero image - high priority, eager loading */}
      <OptimizedImage
        src="/roofer.png"
        alt="Home Improvement"
        width={1200}
        height={600}
        priority={true}
        className="rounded-lg shadow-lg"
      />

      {/* Responsive image with multiple formats */}
      <ResponsivePicture
        src="/home-improvement.png"
        alt="Home Improvement Services"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="rounded-lg"
      />

      {/* Lazy loaded images for below the fold */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <LazyImage key={i} src={`/category-${i}.png`} alt={`Category ${i}`} className="rounded-lg" />
        ))}
      </div>
    </div>
  )
}

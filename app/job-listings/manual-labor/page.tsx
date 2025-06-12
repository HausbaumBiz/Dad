import JobCategoryPage from "@/components/job-category-page"

export default function ManualLaborJobsPage() {
  const category = {
    title: "Manual Labor",
    description: "Construction, landscaping, moving, and other physical labor positions",
    icon: "🔨",
    color: "bg-amber-100",
  }

  return <JobCategoryPage category={category} categorySlug="manual-labor" />
}

import JobCategoryPage from "@/components/job-category-page"

export default function PartTimeSeasonalJobsPage() {
  const category = {
    title: "Part-Time & Seasonal",
    description: "Temporary, seasonal, and part-time positions across various industries",
    icon: "⏱️",
    color: "bg-amber-100",
  }

  return <JobCategoryPage category={category} categorySlug="part-time-seasonal" />
}

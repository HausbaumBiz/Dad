import JobCategoryPage from "@/components/job-category-page"

export default function FactoryWorkJobsPage() {
  const category = {
    title: "Factory Work",
    description: "Manufacturing, assembly line, production, and warehouse positions",
    icon: "🏭",
    color: "bg-orange-100",
  }

  return <JobCategoryPage category={category} categorySlug="factory-work" />
}

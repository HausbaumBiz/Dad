import JobCategoryPage from "@/components/job-category-page"

export default function OfficeWorkJobsPage() {
  const category = {
    title: "Office Work",
    description: "Administrative, clerical, customer service, and other office-based positions",
    icon: "📊",
    color: "bg-blue-100",
  }

  return <JobCategoryPage category={category} categorySlug="office-work" />
}

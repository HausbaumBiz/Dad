import JobCategoryPage from "@/components/job-category-page"

export default function AgricultureAnimalCareJobsPage() {
  const category = {
    title: "Agriculture & Animal Care",
    description: "Farming, livestock, veterinary assistance, and animal handling positions",
    icon: "🌱",
    color: "bg-green-100",
  }

  return <JobCategoryPage category={category} categorySlug="agriculture-animal-care" />
}

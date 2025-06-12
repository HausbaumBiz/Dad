import JobCategoryPage from "@/components/job-category-page"

export default function MedicalJobsPage() {
  const category = {
    title: "Medical",
    description: "Healthcare, nursing, medical administration, and other healthcare positions",
    icon: "🏥",
    color: "bg-blue-50",
  }

  return <JobCategoryPage category={category} categorySlug="medical" />
}

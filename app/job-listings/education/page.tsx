"use client"

import JobCategoryPage from "@/components/job-category-page"

export default function EducationJobsPage() {
  const category = {
    title: "Education",
    description: "Teaching, tutoring, administration, and other education-related positions",
    icon: "🎓",
    color: "bg-blue-100",
  }

  return <JobCategoryPage category={category} categorySlug="education" />
}

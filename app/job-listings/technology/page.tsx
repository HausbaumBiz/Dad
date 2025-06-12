"use client"

import JobCategoryPage from "@/components/job-category-page"

export default function TechnologyJobsPage() {
  const category = {
    title: "Technology",
    description: "IT, software development, technical support, and other tech positions",
    icon: "💻",
    color: "bg-indigo-100",
  }

  return <JobCategoryPage category={category} categorySlug="technology" />
}

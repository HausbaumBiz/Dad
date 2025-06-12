"use client"

import JobCategoryPage from "@/components/job-category-page"

export default function ArtsEntertainmentJobsPage() {
  const category = {
    title: "Arts & Entertainment",
    description: "Performing arts, music, design, media production, and creative positions",
    icon: "🎭",
    color: "bg-purple-100",
  }

  return <JobCategoryPage category={category} categorySlug="arts-entertainment" />
}

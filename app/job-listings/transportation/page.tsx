"use client"

import JobCategoryPage from "@/components/job-category-page"

export default function TransportationJobsPage() {
  const category = {
    title: "Transportation",
    description: "Driving, delivery, logistics, and transportation-related positions",
    icon: "🚚",
    color: "bg-amber-100",
  }

  return <JobCategoryPage category={category} categorySlug="transportation" />
}

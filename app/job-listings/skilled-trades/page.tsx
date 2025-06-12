"use client"

import JobCategoryPage from "@/components/job-category-page"

export default function SkilledTradesJobsPage() {
  const category = {
    title: "Skilled Trades",
    description: "Electrician, plumber, carpenter, and other skilled trade positions",
    icon: "🔧",
    color: "bg-amber-100",
  }

  return <JobCategoryPage category={category} categorySlug="skilled-trades" />
}

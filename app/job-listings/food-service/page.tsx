"use client"

import JobCategoryPage from "@/components/job-category-page"

export default function FoodServiceJobsPage() {
  const category = {
    title: "Food Service",
    description: "Restaurant, catering, food preparation, and hospitality positions",
    icon: "🍽️",
    color: "bg-amber-100",
  }

  return <JobCategoryPage category={category} categorySlug="food-service" />
}

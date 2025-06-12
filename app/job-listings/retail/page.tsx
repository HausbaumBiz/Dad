"use client"

import JobCategoryPage from "@/components/job-category-page"

export default function RetailJobsPage() {
  const category = {
    title: "Retail",
    description: "Sales, cashier, merchandising, and customer-facing retail positions",
    icon: "🛍️",
    color: "bg-pink-100",
  }

  return <JobCategoryPage category={category} categorySlug="retail" />
}

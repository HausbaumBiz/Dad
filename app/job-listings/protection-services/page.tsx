"use client"

import JobCategoryPage from "@/components/job-category-page"

export default function ProtectionServicesJobsPage() {
  const category = {
    title: "Protection Services",
    description: "Security, law enforcement, fire protection, and safety-related positions",
    icon: "🛡️",
    color: "bg-amber-100",
  }

  return <JobCategoryPage category={category} categorySlug="protection-services" />
}

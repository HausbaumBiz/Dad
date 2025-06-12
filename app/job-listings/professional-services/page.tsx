"use client"

import JobCategoryPage from "@/components/job-category-page"

export default function ProfessionalServicesJobsPage() {
  const category = {
    title: "Professional Services",
    description: "Legal, accounting, consulting, and other professional service positions",
    icon: "👔",
    color: "bg-indigo-100",
  }

  return <JobCategoryPage category={category} categorySlug="professional-services" />
}

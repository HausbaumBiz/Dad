"use client"

import JobCategoryPage from "@/components/job-category-page"

export default function NonMedicalCareJobsPage() {
  const category = {
    title: "Non-Medical Care Giver",
    description: "Elderly care, childcare, companion care, and other non-medical caregiving roles",
    icon: "👨‍👩‍👧",
    color: "bg-purple-100",
  }

  return <JobCategoryPage category={category} categorySlug="non-medical-care" />
}

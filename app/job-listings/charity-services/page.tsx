"use client"

import JobCategoryPage from "@/components/job-category-page"

export default function CharityServicesJobsPage() {
  const category = {
    title: "Charity Services",
    description: "Non-profit, volunteer coordination, fundraising, and community outreach roles",
    icon: "🤝",
    color: "bg-purple-100",
  }

  return <JobCategoryPage category={category} categorySlug="charity-services" />
}

import type { JobListing } from "@/app/actions/job-actions"

export interface FormattedJobListing {
  id: string
  title: string
  company: string
  location: string
  salary?: string
  type?: string
  posted: string
  description: string
  logo?: string
}

export function formatJobForDisplay(job: JobListing): FormattedJobListing {
  // Format salary based on pay type
  let salary = ""
  if (job.payType === "hourly") {
    salary = `$${job.hourlyMin || ""}${job.hourlyMax ? "-$" + job.hourlyMax : ""}/hr`
  } else if (job.payType === "salary") {
    salary = `$${job.salaryMin || ""}${job.salaryMax ? "-$" + job.salaryMax : ""}/yr`
  } else {
    salary = job.otherPay || "Compensation details upon inquiry"
  }

  // Format posted date
  const postedDate = job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "Recently"

  return {
    id: job.id,
    title: job.jobTitle,
    company: job.businessName,
    location: job.businessAddress || "Location varies",
    salary,
    type: job.workHours || "Not specified",
    posted: postedDate,
    description: job.jobDescription,
    logo: job.logoUrl,
  }
}

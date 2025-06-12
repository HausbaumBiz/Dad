import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Clock, DollarSign, Briefcase, Building } from "lucide-react"

interface JobListingCardProps {
  job: {
    id: string
    businessId?: string // Add businessId to the props
    title: string
    company: string
    location: string
    salary?: string
    type?: string
    posted: string
    description: string
    logo?: string
    categories?: string[] // Add categories
  }
}

export function JobListingCard({ job }: JobListingCardProps) {
  // Create the correct job detail URL
  // If businessId is provided separately, use it, otherwise assume id contains both
  const jobDetailUrl = job.businessId ? `/job-listings/job/${job.businessId}/${job.id}` : `/job-listings/job/${job.id}`

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold">{job.title}</h3>
          <p className="text-primary font-medium">{job.company}</p>

          {/* Add categories display */}
          {job.categories && job.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {job.categories.map((category, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {category}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-y-2 gap-x-4 mt-3 text-sm text-gray-600">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{job.location}</span>
            </div>

            {job.salary && (
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                <span>{job.salary}</span>
              </div>
            )}

            {job.type && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>{job.type}</span>
              </div>
            )}

            <div className="flex items-center">
              <Building className="h-4 w-4 mr-1" />
              <span>Posted {job.posted}</span>
            </div>
          </div>

          <p className="mt-3 text-gray-600 line-clamp-2">{job.description}</p>

          <div className="mt-4 pt-3 border-t">
            <Link href={jobDetailUrl} className="text-primary font-medium flex items-center">
              <Briefcase className="mr-2 h-4 w-4" />
              View Job Details
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

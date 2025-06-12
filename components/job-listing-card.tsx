import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, DollarSign, Briefcase } from "lucide-react"
import Link from "next/link"

interface JobListingCardProps {
  job: {
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
}

export function JobListingCard({ job }: JobListingCardProps) {
  return (
    <Card className="mb-4 overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
              {job.logo ? (
                <img
                  src={job.logo || "/placeholder.svg"}
                  alt={`${job.company} logo`}
                  className="max-w-full max-h-full p-2"
                />
              ) : (
                <Briefcase className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div className="flex-grow">
              <h3 className="text-xl font-semibold">{job.title}</h3>
              <p className="text-primary font-medium">{job.company}</p>

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
                    <Briefcase className="h-4 w-4 mr-1" />
                    <span>{job.type}</span>
                  </div>
                )}

                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Posted {job.posted}</span>
                </div>
              </div>

              <p className="mt-3 text-gray-600 line-clamp-2">{job.description}</p>

              <div className="mt-4">
                <Button asChild>
                  <Link href={`/job-listings/job/${job.id}`}>View Job</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

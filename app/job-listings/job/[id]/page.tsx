"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, MapPin, Clock, DollarSign, Briefcase, Building, Phone, Mail } from "lucide-react"
import { generateSampleJobs } from "@/lib/sample-jobs"

export default function JobDetailPage({ params }: { params: { id: string } }) {
  // Extract category from job ID (format: job-category-number)
  const idParts = params.id.split("-")
  const category = idParts.length > 1 ? idParts[1] : "office-work"
  const jobNumber = Number.parseInt(idParts[idParts.length - 1]) || 1

  // Generate sample jobs for this category
  const jobs = generateSampleJobs(category, Math.max(jobNumber, 10))

  // Find the specific job
  const job = jobs.find((j) => j.id === params.id) || jobs[0]

  // Generate related jobs (excluding current job)
  const relatedJobs = jobs.filter((j) => j.id !== params.id).slice(0, 3)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <Link href="/">
              <img
                src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/hausbaumbiz03-pppfkt6a4UyL8TdkxntO73GQrsTeeU.png"
                alt="Hausbaum Logo"
                className="h-64 w-auto"
              />
            </Link>
          </div>

          <div className="flex space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/">Home</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/job-listings">Job Listings</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="pl-0">
            <Link href={`/job-listings/${category}`} className="flex items-center text-primary">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to{" "}
              {category
                .split("-")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}{" "}
              Jobs
            </Link>
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center">
                {job.logo ? (
                  <img
                    src={job.logo || "/placeholder.svg"}
                    alt={`${job.company} logo`}
                    className="max-w-full max-h-full p-2"
                  />
                ) : (
                  <Briefcase className="h-10 w-10 text-gray-400" />
                )}
              </div>

              <div className="flex-grow">
                <h1 className="text-2xl md:text-3xl font-bold">{job.title}</h1>
                <p className="text-primary text-lg font-medium mt-1">{job.company}</p>

                <div className="flex flex-wrap gap-y-3 gap-x-6 mt-4">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>{job.location}</span>
                  </div>

                  {job.salary && (
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="h-5 w-5 mr-2" />
                      <span>{job.salary}</span>
                    </div>
                  )}

                  {job.type && (
                    <div className="flex items-center text-gray-600">
                      <Briefcase className="h-5 w-5 mr-2" />
                      <span>{job.type}</span>
                    </div>
                  )}

                  <div className="flex items-center text-gray-600">
                    <Clock className="h-5 w-5 mr-2" />
                    <span>Posted {job.posted}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <Button size="lg">Apply Now</Button>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Job Description</h2>
              <p className="text-gray-700 whitespace-pre-line">
                {job.description}
                {"\n\n"}
                We are seeking a talented and motivated {job.title} to join our team at {job.company}. This is an
                excellent opportunity to work with a dynamic team in a growing company.
                {"\n\n"}
                The ideal candidate will have strong communication skills, attention to detail, and the ability to work
                both independently and as part of a team.
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">Responsibilities</h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>Perform all duties related to the {job.title} position</li>
                <li>Collaborate with team members to achieve company goals</li>
                <li>Maintain accurate records and documentation</li>
                <li>Provide excellent service to internal and external stakeholders</li>
                <li>Participate in training and development opportunities</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">Qualifications</h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>Previous experience in a similar role preferred</li>
                <li>Strong communication and interpersonal skills</li>
                <li>Ability to work in a fast-paced environment</li>
                <li>Attention to detail and problem-solving abilities</li>
                <li>Reliable transportation and ability to work scheduled hours</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">Benefits</h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>Competitive compensation package</li>
                <li>Health insurance options</li>
                <li>Paid time off</li>
                <li>Professional development opportunities</li>
                <li>Friendly and supportive work environment</li>
              </ul>
            </div>
          </div>

          <div className="bg-gray-50 p-6 md:p-8 border-t">
            <h2 className="text-xl font-semibold mb-4">About {job.company}</h2>
            <p className="text-gray-700 mb-6">
              {job.company} is a leading organization in our industry, committed to excellence and innovation. We value
              our employees and strive to create a positive and inclusive workplace where everyone can thrive.
            </p>

            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex items-start">
                <Building className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Company Address</h3>
                  <p className="text-gray-600">
                    123 Business Street
                    <br />
                    {job.location}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Phone className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Phone</h3>
                  <p className="text-gray-600">(555) 123-4567</p>
                </div>
              </div>

              <div className="flex items-start">
                <Mail className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Email</h3>
                  <p className="text-gray-600">careers@{job.company.toLowerCase().replace(/\s+/g, "")}.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Jobs Section */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-6">Similar Jobs</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedJobs.map((relatedJob) => (
              <Link href={`/job-listings/job/${relatedJob.id}`} key={relatedJob.id} className="block">
                <div className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow h-full flex flex-col">
                  <h3 className="text-lg font-semibold">{relatedJob.title}</h3>
                  <p className="text-primary font-medium mt-1">{relatedJob.company}</p>

                  <div className="flex items-center mt-3 text-gray-600 text-sm">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{relatedJob.location}</span>
                  </div>

                  {relatedJob.type && (
                    <div className="flex items-center mt-2 text-gray-600 text-sm">
                      <Briefcase className="h-4 w-4 mr-1" />
                      <span>{relatedJob.type}</span>
                    </div>
                  )}

                  <p className="mt-3 text-gray-600 text-sm line-clamp-2 flex-grow">{relatedJob.description}</p>

                  <div className="mt-4 pt-3 border-t text-primary font-medium text-sm">View Job Details</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <footer className="bg-primary text-white py-8 relative mt-10">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "url('/texture0079.png')",
            backgroundRepeat: "repeat",
            mixBlendMode: "multiply",
          }}
        ></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-bold">Hausbaum</h2>
              <p className="text-sm mt-2">© {new Date().getFullYear()} Hausbaum. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

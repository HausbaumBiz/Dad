import Image from "next/image"
import Link from "next/link"

export default function WorkbenchPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex justify-end mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-home"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Home Page
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 flex justify-center items-start">
            <div className="relative w-full max-w-md h-64">
              <Image src="/hausbaumbiz03.png" alt="Hausbaum Logo" fill style={{ objectFit: "contain" }} priority />
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Workbenches</h2>

              <div className="space-y-4">
                <WorkbenchButton
                  href="/business-focus"
                  iconSrc="/business-cards-icon.png"
                  label="Your Business Focus"
                />

                <WorkbenchButton href="/ad-design" iconSrc="/ad-workbench-icon.png" label="Ad Workbench" />

                <WorkbenchButton href="/coupons" iconSrc="/money-saver-icon.png" label="Penny Saver Workbench" />

                <WorkbenchButton href="/job-listing" iconSrc="/jobs-icon.png" label="Create A Job Listing" />

                <WorkbenchButton href="/statistics" iconSrc="/statistics-icon.png" label="Statistics Dashboard" />

                <WorkbenchButton href="/user-account" iconSrc="/user-account-icon.png" label="User Account" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

interface WorkbenchButtonProps {
  href: string
  iconSrc: string
  label: string
}

function WorkbenchButton({ href, iconSrc, label }: WorkbenchButtonProps) {
  return (
    <Link
      href={href}
      className="flex items-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all group"
    >
      <div className="flex items-center justify-center w-16 h-16 mr-6 flex-shrink-0">
        <Image
          src={iconSrc || "/placeholder.svg"}
          alt={label}
          width={64}
          height={64}
          className="object-contain max-h-full"
        />
      </div>
      <span className="text-xl font-medium text-gray-800 group-hover:text-primary transition-colors">{label}</span>
    </Link>
  )
}

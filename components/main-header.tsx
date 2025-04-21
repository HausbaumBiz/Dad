import Link from "next/link"
import Image from "next/image"

export function MainHeader() {
  return (
    <header className="bg-white border-b border-gray-200 py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <div className="relative w-40 h-12">
            <Image src="/hausbaumbiz03.png" alt="Hausbaum Logo" fill style={{ objectFit: "contain" }} />
          </div>
        </Link>
        <Link
          href="/workbench"
          className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700"
        >
          Back to Workbench
        </Link>
      </div>
    </header>
  )
}

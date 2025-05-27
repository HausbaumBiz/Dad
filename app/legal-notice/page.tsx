import Image from "next/image"
import Link from "next/link"
import { LegalAgreement } from "@/components/legal-agreement"

export default function LegalNoticePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <header className="py-12 px-6 border-b border-gray-100 flex flex-col items-center">
            <div className="relative" style={{ width: "512px", height: "256px" }}>
              <Image
                src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/hausbaumbiz03-pppfkt6a4UyL8TdkxntO73GQrsTeeU.png"
                alt="Hausbaum Logo"
                fill
                style={{ objectFit: "contain" }}
                priority
              />
            </div>
            <Link href="/" className="mt-4 text-gray-600 hover:text-primary transition-colors flex items-center gap-2">
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
              <span>Home</span>
            </Link>
          </header>

          <LegalAgreement />
        </div>
      </div>
    </main>
  )
}

import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CategoryLayoutProps {
  children: React.ReactNode
  title: string
  backLink?: string
  backText?: string
}

export function CategoryLayout({ children, title, backLink = "/", backText = "Home" }: CategoryLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <Link href="/">
              <Image
                src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/hausbaumbiz03-pppfkt6a4UyL8TdkxntO73GQrsTeeU.png"
                alt="Hausbaum Logo"
                width={600}
                height={300}
                className="h-64 w-auto"
              />
            </Link>
          </div>

          <div className="flex space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/">Home</Link>
            </Button>
            {backLink !== "/" && (
              <Button variant="ghost" asChild>
                <Link href={backLink}>Back</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="pl-0">
            <Link href={backLink} className="flex items-center text-primary">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to {backText}
            </Link>
          </Button>
        </div>

        <h1 className="text-3xl font-bold text-center mb-8">{title}</h1>

        {children}
      </main>

      <footer className="bg-primary text-white py-8 relative">
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

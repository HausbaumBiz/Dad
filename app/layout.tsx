import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "./mobile-styles.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
// Import the DialogOverlayFix component
import { DialogOverlayFix } from "@/components/ui/dialog-fix"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Hausbaum - Find Local Service Professionals",
  description: "Connect with trusted local experts and service professionals in your area.",
    generator: 'v0.dev'
}

// Add the DialogOverlayFix component to the layout
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <DialogOverlayFix />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

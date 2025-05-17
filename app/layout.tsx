import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "./mobile-styles.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { DialogOverlayFix } from "@/components/ui/dialog-fix"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Hausbaum - Find Local Service Professionals",
  description: "Connect with trusted local experts and service professionals in your area.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <DialogOverlayFix />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { UserProvider } from "@/contexts/user-context"
import { ErrorBoundary } from "@/components/error-boundary"
import { setupGlobalErrorHandlers } from "@/lib/error-handler"

// Initialize global error handlers
if (typeof window !== "undefined") {
  setupGlobalErrorHandlers()
}

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
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <ErrorBoundary componentName="RootLayout">
            <UserProvider>
              {children}
              <Toaster />
            </UserProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}

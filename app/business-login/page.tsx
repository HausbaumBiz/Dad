"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function BusinessLoginPage({
  searchParams,
}: {
  searchParams?: { verified?: string }
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showVerifiedMessage, setShowVerifiedMessage] = useState(false)

  useEffect(() => {
    if (searchParams?.verified === "true") {
      setShowVerifiedMessage(true)

      // Hide the message after 5 seconds
      const timer = setTimeout(() => {
        setShowVerifiedMessage(false)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [searchParams?.verified])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle login logic here
    console.log("Login attempt with:", email, password)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="pl-0">
            <Link href="/" className="flex items-center text-primary">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          <div className="md:w-1/3 flex justify-center">
            <Image
              src="/hausbaumbiz03.png"
              alt="Hausbaum Logo"
              width={600}
              height={300}
              className="max-w-full h-auto"
            />
          </div>

          <Card className="w-full md:w-1/3">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Business Login</CardTitle>
              {showVerifiedMessage && (
                <Alert className="mt-4 bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">
                    Your email has been verified successfully! You can now log in.
                  </AlertDescription>
                </Alert>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white">
                  Login
                </Button>

                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600">
                    Need an account?{" "}
                    <Link href="/business-register" className="text-primary hover:underline">
                      Create One Here
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

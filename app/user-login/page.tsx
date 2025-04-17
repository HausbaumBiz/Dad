"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle } from "lucide-react"
import { loginUser } from "@/app/actions/user-actions"
import { useToast } from "@/components/ui/use-toast"

export default function UserLoginPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const searchParams = useSearchParams()
  const registered = searchParams.get("registered")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Create a FormData object from the form data
      const formDataObj = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        formDataObj.append(key, value)
      })

      // Call the server action
      const result = await loginUser(formDataObj)

      // Handle the result
      if (!result.success) {
        toast({
          title: "Login failed",
          description: result.message,
          variant: "destructive",
        })
      }
      // If successful, the server action will redirect
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
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
          <div className="md:w-1/4 flex flex-col items-center">
            <Image
              src="/hausbaumbiz03.png"
              alt="Hausbaum Logo"
              width={600}
              height={300}
              className="max-w-full h-auto mb-6"
            />

            <Card className="w-full">
              <CardContent className="p-4">
                <p className="text-gray-700">
                  Sign in to access your account, manage your service requests, and leave reviews for service providers.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="w-full md:w-1/3">
            <CardHeader>
              <CardTitle className="text-2xl text-center">User Login</CardTitle>
              <p className="text-center text-gray-600">Welcome back!</p>
            </CardHeader>
            <CardContent>
              {registered && (
                <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
                  <CheckCircle className="h-4 w-4 text-green-800" />
                  <AlertDescription>Registration successful! Please log in with your new account.</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={formData.password} onChange={handleChange} required />
                </div>

                <div className="text-right">
                  <Link href="#" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Logging in..." : "Login"}
                </Button>

                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{" "}
                    <Link href="/user-register" className="text-primary hover:underline">
                      Register
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

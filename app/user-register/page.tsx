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
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export default function UserRegisterPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    zipCode: "",
    password: "",
    confirmPassword: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Passwords do not match",
          description: "Please make sure your passwords match",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Create a FormData object from the form data
      const formDataObj = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        formDataObj.append(key, value)
      })

      // Call the API endpoint
      const response = await fetch("/api/auth/register", {
        method: "POST",
        body: formDataObj,
      })

      const result = await response.json()

      if (!result.success) {
        toast({
          title: "Registration failed",
          description: result.message,
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Trigger a storage event to notify other tabs
      localStorage.setItem("auth_state_change", Date.now().toString())

      // Redirect to login page with registered flag
      router.push("/user-login?registered=true")
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later",
        variant: "destructive",
      })
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
                  Register to access exclusive features, save your favorite service providers, and leave reviews.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="w-full md:w-1/3">
            <CardHeader>
              <CardTitle className="text-2xl text-center">User Registration</CardTitle>
              <p className="text-center text-gray-600">Create your account</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={formData.firstName} onChange={handleChange} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={formData.lastName} onChange={handleChange} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input id="zipCode" value={formData.zipCode} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={formData.password} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Registering..." : "Register"}
                </Button>

                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link href="/user-login" className="text-primary hover:underline">
                      Login
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

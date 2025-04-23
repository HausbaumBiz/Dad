"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronLeft, CheckCircle, Eye, EyeOff } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { loginUser } from "@/app/actions/user-actions"
import { useToast } from "@/components/ui/use-toast"

export default function UserLoginPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const searchParams = useSearchParams()
  const registered = searchParams.get("registered")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("") // Clear previous errors

    try {
      // Create a FormData object from the form data
      const formDataObj = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        formDataObj.append(key, value)
      })

      // Add the remember me preference
      formDataObj.append("rememberMe", rememberMe.toString())

      // Call the server action
      const result = await loginUser(formDataObj)

      // Handle the result
      if (!result.success) {
        setError(result.message || "Invalid username or password")
        toast({
          title: "Login failed",
          description: result.message,
          variant: "destructive",
        })
      }
      // If successful, the server action will redirect
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
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
              src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/hausbaumbiz03-pppfkt6a4UyL8TdkxntO73GQrsTeeU.png"
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
              <form onSubmit={handleSubmit} className="space-y-4">
                {registered && (
                  <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
                    <CheckCircle className="h-4 w-4 text-green-800" />
                    <AlertDescription>Registration successful! Please log in with your new account.</AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert className="mb-4 bg-red-50 border-red-200 text-red-800">
                    <AlertDescription className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      onClick={togglePasswordVisibility}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                    Remember me for 30 days
                  </Label>
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

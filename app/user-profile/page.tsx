"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { ProtectedRoute } from "@/components/protected-route"
import { useUser } from "@/contexts/user-context"
import { ErrorBoundary } from "@/components/error-boundary"
import { ErrorFallback } from "@/components/error-fallback"
import { useSafeFetch } from "@/hooks/use-safe-fetch"

export default function UserProfilePage() {
  const { toast } = useToast()
  const { user, refreshUserData } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    zipCode: "",
  })

  const { safeFetch, error } = useSafeFetch({
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message || "An error occurred",
        variant: "destructive",
      })
    },
  })

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        zipCode: user.zipCode,
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      await safeFetch(async () => {
        // Create a FormData object from the form data
        const formDataObj = new FormData()
        Object.entries(formData).forEach(([key, value]) => {
          formDataObj.append(key, value)
        })
        formDataObj.append("userId", user?.id || "")

        // Call the API endpoint
        const response = await fetch("/api/user/update", {
          method: "POST",
          body: formDataObj,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to update profile")
        }

        const result = await response.json()

        if (result.success) {
          toast({
            title: "Profile updated",
            description: "Your profile has been updated successfully",
          })
          setIsEditing(false)
          refreshUserData() // Refresh user data after update
        } else {
          throw new Error(result.message || "Failed to update profile")
        }

        return result
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <ProtectedRoute>
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

          <div className="max-w-2xl mx-auto">
            <ErrorBoundary
              fallback={
                <ErrorFallback
                  title="Profile Error"
                  description="We encountered an error while loading your profile."
                  showHomeButton={true}
                />
              }
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">User Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">{error.message}</div>}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          disabled={!isEditing}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          disabled={!isEditing}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={true} // Email cannot be changed
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Zip Code</Label>
                      <Input
                        id="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        disabled={!isEditing}
                        required
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      {isEditing ? (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsEditing(false)
                              // Reset form data to original values
                              if (user) {
                                setFormData({
                                  firstName: user.firstName,
                                  lastName: user.lastName,
                                  email: user.email,
                                  zipCode: user.zipCode,
                                })
                              }
                            }}
                            disabled={isSaving}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save Changes"}
                          </Button>
                        </>
                      ) : (
                        <Button type="button" onClick={() => setIsEditing(true)}>
                          Edit Profile
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { User } from "@/lib/user"
import { logoutUser } from "@/app/actions/user-actions"

export default function UserProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get the user ID from cookies
    const cookies = document.cookie.split(";")
    const userIdCookie = cookies.find((cookie) => cookie.trim().startsWith("userId="))
    const userId = userIdCookie ? userIdCookie.split("=")[1] : null

    if (!userId) {
      router.push("/user-login")
      return
    }

    // Fetch user data
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/user?id=${userId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch user data")
        }
        const userData = await response.json()
        setUser(userData)
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  const handleLogout = async () => {
    await logoutUser()
  }

  if (loading) {
    return <div className="container mx-auto p-8 text-center">Loading...</div>
  }

  if (!user) {
    return <div className="container mx-auto p-8 text-center">User not found</div>
  }

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">User Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Name</h3>
              <p className="mt-1">
                {user.firstName} {user.lastName}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="mt-1">{user.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Zip Code</h3>
              <p className="mt-1">{user.zipCode}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Member Since</h3>
              <p className="mt-1">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={handleLogout} variant="destructive">
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

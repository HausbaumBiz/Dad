"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { checkUserExists, getAllUserEmails } from "./actions"

export default function CheckUserPage() {
  const [email, setEmail] = useState("yam@yahoo.com")
  const [result, setResult] = useState<any>(null)
  const [allEmails, setAllEmails] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [emailsLoading, setEmailsLoading] = useState(false)

  const handleCheckUser = async () => {
    if (!email.trim()) return

    setLoading(true)
    try {
      const result = await checkUserExists(email.trim())
      setResult(result)
    } catch (error) {
      console.error("Error checking user:", error)
      setResult({ exists: false, error: "Failed to check user" })
    } finally {
      setLoading(false)
    }
  }

  const handleGetAllEmails = async () => {
    setEmailsLoading(true)
    try {
      const result = await getAllUserEmails()
      if (result.success) {
        setAllEmails(result.emails)
      }
    } catch (error) {
      console.error("Error getting all emails:", error)
    } finally {
      setEmailsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCheckUser()
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">User Database Checker</h1>
        <p className="text-muted-foreground">
          Check if users exist in the Redis database and view all registered users.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Check Specific User */}
        <Card>
          <CardHeader>
            <CardTitle>Check Specific User</CardTitle>
            <CardDescription>Enter an email address to check if the user exists in the database.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleCheckUser} disabled={loading}>
                {loading ? "Checking..." : "Check"}
              </Button>
            </div>

            <Button
              onClick={() => {
                setEmail("yam@yahoo.com")
                setTimeout(() => handleCheckUser(), 100)
              }}
              variant="outline"
              className="w-full"
              disabled={loading}
            >
              Check yam@yahoo.com
            </Button>

            {result && (
              <div className="mt-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={result.exists ? "default" : "secondary"}>
                    {result.exists ? "EXISTS" : "NOT FOUND"}
                  </Badge>
                  {result.error && <Badge variant="destructive">ERROR</Badge>}
                </div>

                {result.exists && result.user && (
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>ID:</strong> {result.user.id}
                    </div>
                    <div>
                      <strong>Name:</strong> {result.user.firstName} {result.user.lastName}
                    </div>
                    <div>
                      <strong>Email:</strong> {result.user.email}
                    </div>
                    <div>
                      <strong>Zip Code:</strong> {result.user.zipCode}
                    </div>
                    <div>
                      <strong>Created:</strong> {new Date(result.user.createdAt).toLocaleString()}
                    </div>
                    <div>
                      <strong>Has Password:</strong> {result.user.hasPassword ? "Yes" : "No"}
                    </div>
                  </div>
                )}

                {result.error && <div className="text-red-600 text-sm">Error: {result.error}</div>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* View All Users */}
        <Card>
          <CardHeader>
            <CardTitle>All Registered Users</CardTitle>
            <CardDescription>View all user email addresses in the database.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleGetAllEmails} disabled={emailsLoading} className="w-full">
              {emailsLoading ? "Loading..." : "Get All User Emails"}
            </Button>

            {allEmails.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Users:</span>
                  <Badge>{allEmails.length}</Badge>
                </div>

                <Separator />

                <div className="max-h-64 overflow-y-auto space-y-1">
                  {allEmails.map((email, index) => (
                    <div
                      key={index}
                      className="text-sm p-2 bg-muted rounded cursor-pointer hover:bg-muted/80"
                      onClick={() => {
                        setEmail(email)
                        handleCheckUser()
                      }}
                    >
                      {email}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Image from "next/image"
import { MainHeader } from "@/components/main-header"
import { MainFooter } from "@/components/main-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, CreditCard, Key, Trash2, User, ArrowLeft } from "lucide-react"
import { getCurrentBusiness } from "@/app/actions/business-actions"

// Business type definition (simplified version from business-actions.ts)
type Business = {
  id: string
  firstName: string
  lastName: string
  businessName: string
  zipCode: string
  email: string
  isEmailVerified: boolean
  createdAt: string
  updatedAt: string
  phone?: string
}

export default function UserAccountPage() {
  // State for business data
  const [businessData, setBusinessData] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // State for delete account dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")

  // State for upgrade success message
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false)
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false)

  // Fetch business data on component mount
  useEffect(() => {
    async function fetchBusinessData() {
      try {
        const business = await getCurrentBusiness()
        setBusinessData(business)
      } catch (err) {
        console.error("Error fetching business data:", err)
        setError("Failed to load business data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchBusinessData()
  }, [])

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (e) {
      return dateString
    }
  }

  // Handle password form changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle password form submission
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Validate passwords
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords don't match!")
      return
    }

    // In a real app, this would call an API to update the password
    console.log("Password updated:", passwordForm)

    // Reset form and show success message
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })

    setShowPasswordSuccess(true)
    setTimeout(() => setShowPasswordSuccess(false), 3000)
  }

  // Handle upgrade to Gold plan
  const handleUpgrade = () => {
    // In a real app, this would redirect to a payment processor or show a payment form
    setBusinessData((prev) => (prev ? { ...prev, plan: "Gold" } : null))
    setShowUpgradeSuccess(true)
    setTimeout(() => setShowUpgradeSuccess(false), 3000)
  }

  // Handle account deletion
  const handleDeleteAccount = () => {
    if (!businessData || deleteConfirmText !== businessData.email) {
      alert("Email confirmation doesn't match!")
      return
    }

    // In a real app, this would call an API to delete the account
    alert("Account deleted successfully. You will be redirected to the homepage.")
    // Redirect would happen here
    setIsDeleteDialogOpen(false)
  }

  // Determine plan status - in a real app, this would come from the database
  const plan = businessData?.plan || "Free"

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainHeader />

      {/* Back to Workbench Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => (window.location.href = "/workbench")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Workbench
          </Button>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16">
              <Image
                src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/user-account-icon%20sm-PZ61Ko9nsGv5oeESUWjM2pDekdeewQ.png"
                alt="User Account"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Business Account</h1>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        ) : businessData ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Business Profile Card */}
            <Card className="lg:col-span-1">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <div className="flex items-center gap-3">
                  <User className="h-6 w-6 text-primary" />
                  <CardTitle>Business Profile</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                    <span className="text-4xl font-bold text-gray-500">{businessData.businessName.charAt(0)}</span>
                  </div>
                  <h2 className="text-xl font-bold">{businessData.businessName}</h2>
                  <p className="text-gray-600">{businessData.email}</p>
                  <div className="mt-2">
                    <Badge
                      variant={plan === "Gold" ? "default" : "outline"}
                      className={plan === "Gold" ? "bg-amber-400 hover:bg-amber-500 text-black" : ""}
                    >
                      {plan} Plan
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">First Name:</span>
                    <span className="font-medium">{businessData.firstName}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Last Name:</span>
                    <span className="font-medium">{businessData.lastName}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{businessData.email}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">ZIP Code:</span>
                    <span className="font-medium">{businessData.zipCode}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Member Since:</span>
                    <span className="font-medium">{formatDate(businessData.createdAt)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Account Status:</span>
                    <span className="font-medium text-green-600">
                      {businessData.isEmailVerified ? "Active" : "Pending Verification"}
                    </span>
                  </div>
                  {businessData.phone && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{businessData.phone}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Account Management Tabs */}
            <Card className="lg:col-span-2">
              <Tabs defaultValue="subscription">
                <CardHeader className="border-b pb-0">
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="subscription">Subscription</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="danger">Danger Zone</TabsTrigger>
                  </TabsList>
                </CardHeader>

                <CardContent className="pt-6">
                  {/* Subscription Tab */}
                  <TabsContent value="subscription" className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium">Current Plan</h3>
                          <p className="text-gray-600">You are currently on the {plan} plan</p>
                        </div>
                        <Badge
                          variant={plan === "Gold" ? "default" : "outline"}
                          className={plan === "Gold" ? "bg-amber-400 hover:bg-amber-500 text-black" : ""}
                        >
                          {plan} Plan
                        </Badge>
                      </div>

                      {showUpgradeSuccess && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          <span>Successfully upgraded to Gold Plan!</span>
                        </div>
                      )}

                      {plan === "Free" ? (
                        <Card>
                          <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100">
                            <CardTitle className="text-amber-800">Upgrade to Gold Plan</CardTitle>
                            <CardDescription>Get premium features and benefits</CardDescription>
                          </CardHeader>
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              <div className="flex items-start gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-medium">Unlimited Job Listings</p>
                                  <p className="text-sm text-gray-600">
                                    Post as many job opportunities as you need with no restrictions
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-medium">Advanced Analytics</p>
                                  <p className="text-sm text-gray-600">
                                    Get detailed insights about your ad performance and customer engagement. Compare
                                    your metrics directly against top competitors in your industry to identify
                                    opportunities for growth and optimization.
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-medium">Penny Saver Placement for Coupons</p>
                                  <p className="text-sm text-gray-600">
                                    Premium placement for your coupons in the Penny Saver section
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-medium">Awards Program Participation</p>
                                  <p className="text-sm text-gray-600">
                                    Earn Gold Medallions based on customer reviews and ratings
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="bg-gray-50 border-t flex justify-between items-center">
                            <div>
                              <p className="text-2xl font-bold">
                                $39.99<span className="text-sm font-normal text-gray-600">/month</span>
                              </p>
                              <p className="text-sm text-gray-600">Cancel anytime</p>
                            </div>
                            <Button onClick={handleUpgrade} className="bg-amber-400 hover:bg-amber-500 text-black">
                              <CreditCard className="mr-2 h-4 w-4" />
                              Upgrade Now
                            </Button>
                          </CardFooter>
                        </Card>
                      ) : (
                        <Card>
                          <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100">
                            <CardTitle className="text-amber-800">Gold Plan</CardTitle>
                            <CardDescription>Your current subscription</CardDescription>
                          </CardHeader>
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-gray-600">Billing Cycle:</span>
                                <span className="font-medium">Monthly</span>
                              </div>
                              <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-gray-600">Next Billing Date:</span>
                                <span className="font-medium">February 15, 2025</span>
                              </div>
                              <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-gray-600">Amount:</span>
                                <span className="font-medium">$39.99</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">Payment Method:</span>
                                <span className="font-medium">Visa ending in 4242</span>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="bg-gray-50 border-t flex justify-between">
                            <Button variant="outline">Update Payment Method</Button>
                            <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                              Cancel Subscription
                            </Button>
                          </CardFooter>
                        </Card>
                      )}
                    </div>
                  </TabsContent>

                  {/* Security Tab */}
                  <TabsContent value="security" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Change Password</h3>

                      {showPasswordSuccess && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center gap-2 mb-4">
                          <CheckCircle className="h-5 w-5" />
                          <span>Password updated successfully!</span>
                        </div>
                      )}

                      <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <Input
                            id="currentPassword"
                            name="currentPassword"
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={handlePasswordChange}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={handlePasswordChange}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={handlePasswordChange}
                            required
                          />
                        </div>

                        <Button type="submit" className="w-full">
                          <Key className="mr-2 h-4 w-4" />
                          Update Password
                        </Button>
                      </form>
                    </div>

                    <div className="pt-4 border-t">
                      <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                      <p className="text-gray-600 mb-4">
                        Add an extra layer of security to your account by enabling two-factor authentication.
                      </p>
                      <Button variant="outline">Set Up Two-Factor Authentication</Button>
                    </div>
                  </TabsContent>

                  {/* Danger Zone Tab */}
                  <TabsContent value="danger">
                    <div className="border border-red-200 rounded-lg p-6 bg-red-50">
                      <h3 className="text-lg font-medium text-red-700 mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Delete Account
                      </h3>
                      <p className="text-gray-700 mb-4">
                        Once you delete your account, there is no going back. All of your data will be permanently
                        removed.
                      </p>
                      <Button
                        variant="destructive"
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Account
                      </Button>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>No business account found. Please log in or register a business account.</span>
          </div>
        )}
      </main>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all your data from our
              servers.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="mb-4">
              To confirm, please type your email address: <strong>{businessData?.email}</strong>
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Enter your email"
              className="border-red-300 focus:border-red-500"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={!businessData || deleteConfirmText !== businessData.email}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MainFooter />
    </div>
  )
}

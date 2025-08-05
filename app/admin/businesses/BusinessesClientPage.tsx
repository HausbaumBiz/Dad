"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Users, UserCheck, UserX } from "lucide-react"
import Link from "next/link"
import { getBusinesses } from "@/app/actions/business-actions"
import { BusinessActionsCell } from "./business-actions-cell"
import type { Business } from "@/lib/definitions"

export default function BusinessesClientPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const loadBusinesses = async () => {
    setIsLoading(true)
    try {
      const businessData = await getBusinesses()
      setBusinesses(businessData)
      setFilteredBusinesses(businessData)
    } catch (error) {
      console.error("Error loading businesses:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBusinesses()
  }, [])

  useEffect(() => {
    const filtered = businesses.filter(
      (business) =>
        business.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.zipCode.includes(searchTerm) ||
        `${business.firstName} ${business.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredBusinesses(filtered)
  }, [searchTerm, businesses])

  const handleBusinessUpdated = () => {
    loadBusinesses()
  }

  // Calculate statistics
  const totalBusinesses = businesses.length
  const activeBusinesses = businesses.filter((b) => (b.status || "active") === "active").length
  const inactiveBusinesses = businesses.filter((b) => b.status === "inactive").length

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading businesses...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Business Management</h1>
          <p className="text-muted-foreground">Manage all registered businesses</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBusinesses}</div>
            <p className="text-xs text-muted-foreground">All registered businesses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Businesses</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeBusinesses}</div>
            <p className="text-xs text-muted-foreground">Currently active accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Businesses</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactiveBusinesses}</div>
            <p className="text-xs text-muted-foreground">Deactivated accounts</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Businesses ({filteredBusinesses.length})</CardTitle>
          <CardDescription>Search and manage business accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search businesses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Zip Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBusinesses.map((business) => {
                  const status = business.status || "active"
                  const isActive = status === "active"

                  return (
                    <TableRow key={business.id}>
                      <TableCell className="font-medium">
                        <Link href={`/admin/businesses/${business.id}`} className="text-blue-600 hover:underline">
                          {business.businessName}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {business.firstName} {business.lastName}
                      </TableCell>
                      <TableCell>{business.email}</TableCell>
                      <TableCell>{business.zipCode}</TableCell>
                      <TableCell>
                        <Badge
                          variant={isActive ? "default" : "destructive"}
                          className={isActive ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(business.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <BusinessActionsCell business={business} onBusinessUpdated={handleBusinessUpdated} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {filteredBusinesses.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No businesses found matching your search.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

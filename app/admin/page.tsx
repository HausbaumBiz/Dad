import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Users } from "lucide-react"

export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="pl-0">
          <Link href="/" className="flex items-center text-primary">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>View and manage registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/users" className="flex items-center justify-center gap-2">
                <Users className="h-4 w-4" />
                <span>View Users</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

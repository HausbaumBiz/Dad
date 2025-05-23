import { getAllUsers } from "@/lib/user"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import MigrateUsersButton from "./migrate-users-button"

export default async function AdminUsersPage() {
  const users = await getAllUsers()

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex justify-between items-center">
        <Button variant="ghost" asChild className="pl-0">
          <Link href="/admin" className="flex items-center text-primary">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Admin Dashboard
          </Link>
        </Button>

        <MigrateUsersButton />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Registered Users</CardTitle>
          <div className="text-sm text-muted-foreground">Total: {users.length}</div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center py-4">No users registered yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Zip Code</TableHead>
                  <TableHead>Registration Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-xs">{user.id}</TableCell>
                    <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.zipCode}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

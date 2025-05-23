import { RefreshCw } from "lucide-react"
import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AdminPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Existing Cards (replace with actual existing cards if any) */}
        <Card>
          <CardHeader>
            <CardTitle>Placeholder Card 1</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is a placeholder card.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Placeholder Card 2</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is another placeholder card.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Placeholder Card 3</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is a third placeholder card.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <RefreshCw className="mr-2 h-5 w-5" />
              Page Mappings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Rebuild business-to-page mappings to ensure businesses appear on category pages.
            </p>
            <div className="space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/admin/rebuild-page-mappings">Rebuild Page Mappings</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/admin/category-mappings">View Category Mappings</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

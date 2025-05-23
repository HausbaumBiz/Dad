"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, RefreshCw, ExternalLink } from "lucide-react"
import Link from "next/link"
import {
  type BusinessCategoryMapping,
  getBusinessCategoryMappings,
  refreshBusinessCategoryMapping,
} from "../actions/category-troubleshooting-actions"

export default function CategoryTroubleshootingClient({
  initialMappings,
}: {
  initialMappings: BusinessCategoryMapping[]
}) {
  const [mappings, setMappings] = useState<BusinessCategoryMapping[]>(initialMappings)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [refreshingId, setRefreshingId] = useState<string | null>(null)

  const filteredMappings = mappings.filter(
    (mapping) =>
      mapping.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.businessId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.categories.some((cat) => cat.toLowerCase().includes(searchTerm.toLowerCase())) ||
      mapping.mappedPages.some((page) => page.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const refreshAllMappings = async () => {
    setIsLoading(true)
    try {
      const refreshedMappings = await getBusinessCategoryMappings()
      setMappings(refreshedMappings)
    } catch (error) {
      console.error("Error refreshing mappings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshSingleMapping = async (businessId: string) => {
    setRefreshingId(businessId)
    try {
      const refreshedMapping = await refreshBusinessCategoryMapping(businessId)
      if (refreshedMapping) {
        setMappings((prev) => prev.map((mapping) => (mapping.businessId === businessId ? refreshedMapping : mapping)))
      }
    } catch (error) {
      console.error(`Error refreshing mapping for ${businessId}:`, error)
    } finally {
      setRefreshingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search businesses, categories, or pages..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={refreshAllMappings} disabled={isLoading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh All
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Category Page Mappings</CardTitle>
          <CardDescription>View which pages businesses are assigned to based on their categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead>Primary Category</TableHead>
                  <TableHead>Mapped Pages</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMappings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      {searchTerm ? "No businesses match your search" : "No businesses found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMappings.map((mapping) => (
                    <TableRow key={mapping.businessId}>
                      <TableCell>
                        <div className="font-medium">{mapping.businessName}</div>
                        <div className="text-xs text-muted-foreground">{mapping.businessId}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {mapping.categories.map((category) => (
                            <Badge key={category} variant="outline">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {mapping.primaryCategory ? (
                          <Badge variant="secondary">{mapping.primaryCategory}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">None set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {mapping.mappedPages.map((page) => (
                            <Link href={`/${page}`} key={page} target="_blank">
                              <Badge className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                                {page} <ExternalLink className="ml-1 h-3 w-3" />
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => refreshSingleMapping(mapping.businessId)}
                            disabled={refreshingId === mapping.businessId}
                          >
                            <RefreshCw
                              className={`h-4 w-4 ${refreshingId === mapping.businessId ? "animate-spin" : ""}`}
                            />
                          </Button>
                          <Link href={`/admin/businesses/${mapping.businessId}`} target="_blank">
                            <Button size="sm" variant="ghost">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

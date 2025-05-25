"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronRight, Search, Database, Copy, Check, Building, ImageIcon, MapPin } from "lucide-react"
import { getBusinessRedisStructure, getAllBusinessIds } from "./actions"
import { useEffect } from "react"

interface RedisData {
  key: string
  type: string
  value: any
  size?: number
}

interface BusinessRedisStructure {
  businessId: string
  businessName?: string
  coreData: RedisData[]
  categories: RedisData[]
  media: RedisData[]
  zipCodes: RedisData[]
  other: RedisData[]
}

export function RedisStructureViewer() {
  const [businessId, setBusinessId] = useState("")
  const [businessIds, setBusinessIds] = useState<string[]>([])
  const [structure, setStructure] = useState<BusinessRedisStructure | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [copiedKey, setCopiedKey] = useState("")

  useEffect(() => {
    async function loadBusinessIds() {
      try {
        const ids = await getAllBusinessIds()
        setBusinessIds(ids)
      } catch (err) {
        console.error("Failed to load business IDs:", err)
      }
    }
    loadBusinessIds()
  }, [])

  const handleSearch = async () => {
    if (!businessId.trim()) {
      setError("Please enter a business ID")
      return
    }

    setLoading(true)
    setError("")

    try {
      const result = await getBusinessRedisStructure(businessId.trim())
      setStructure(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch Redis structure")
      setStructure(null)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(text)
      setTimeout(() => setCopiedKey(""), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const formatValue = (value: any, type: string): string => {
    try {
      // Handle null or undefined values
      if (value === null || value === undefined) {
        return "null"
      }

      // Handle error messages
      if (typeof value === "string" && value.startsWith("Error")) {
        return value
      }

      switch (type) {
        case "string":
          // If it's already a string, try to parse it as JSON for pretty formatting
          if (typeof value === "string") {
            try {
              const parsed = JSON.parse(value)
              return JSON.stringify(parsed, null, 2)
            } catch {
              // Not JSON, return as-is
              return value
            }
          }
          // If it's not a string, stringify it
          return JSON.stringify(value, null, 2)

        case "hash":
        case "set":
        case "list":
        case "zset":
          // Always stringify objects and arrays
          return JSON.stringify(value, null, 2)

        case "error":
          return String(value)

        default:
          // For any other type, convert to string safely
          if (typeof value === "object") {
            return JSON.stringify(value, null, 2)
          }
          return String(value)
      }
    } catch (err) {
      // If anything goes wrong, return a safe string representation
      return `Error formatting value: ${err instanceof Error ? err.message : "Unknown error"}`
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "string":
        return "bg-blue-100 text-blue-800"
      case "hash":
        return "bg-green-100 text-green-800"
      case "set":
        return "bg-purple-100 text-purple-800"
      case "list":
        return "bg-orange-100 text-orange-800"
      case "zset":
        return "bg-red-100 text-red-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const renderDataSection = (title: string, data: RedisData[], icon: React.ReactNode) => {
    if (data.length === 0) return null

    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {title}
            <Badge variant="secondary">{data.length} keys</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.map((item, index) => (
              <Collapsible key={index}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <ChevronRight className="h-4 w-4" />
                    <code className="text-sm font-mono">{item.key}</code>
                    <Badge className={getTypeColor(item.type)}>{item.type}</Badge>
                    {item.size !== undefined && <Badge variant="outline">{item.size} items</Badge>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      copyToClipboard(item.key)
                    }}
                  >
                    {copiedKey === item.key ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96">
                    <pre className="text-sm whitespace-pre-wrap break-words">{formatValue(item.value, item.type)}</pre>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Business Lookup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter Business ID (e.g., 123456)"
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              {businessIds.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-2">Available Business IDs:</p>
                  <div className="flex flex-wrap gap-2">
                    {businessIds.slice(0, 10).map((id) => (
                      <Button key={id} variant="outline" size="sm" onClick={() => setBusinessId(id)}>
                        {id}
                      </Button>
                    ))}
                    {businessIds.length > 10 && <Badge variant="secondary">+{businessIds.length - 10} more</Badge>}
                  </div>
                </div>
              )}
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? "Loading..." : "Analyze Structure"}
            </Button>
          </div>
          {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
        </CardContent>
      </Card>

      {/* Results Section */}
      {structure && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Redis Structure for Business: {structure.businessId}
                {structure.businessName && <Badge variant="outline">{structure.businessName}</Badge>}
              </CardTitle>
            </CardHeader>
          </Card>

          {renderDataSection("Core Business Data", structure.coreData, <Building className="h-4 w-4" />)}

          {renderDataSection("Categories", structure.categories, <Database className="h-4 w-4" />)}

          {renderDataSection("Media & Content", structure.media, <ImageIcon className="h-4 w-4" />)}

          {renderDataSection("ZIP Codes & Service Areas", structure.zipCodes, <MapPin className="h-4 w-4" />)}

          {renderDataSection("Other Data", structure.other, <Database className="h-4 w-4" />)}

          {structure.coreData.length === 0 &&
            structure.categories.length === 0 &&
            structure.media.length === 0 &&
            structure.zipCodes.length === 0 &&
            structure.other.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No Redis data found for this business ID.</p>
                </CardContent>
              </Card>
            )}
        </div>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { searchRedisKeys, getRedisValue } from "./actions"

export default function RedisBrowser() {
  const [pattern, setPattern] = useState("*")
  const [keys, setKeys] = useState<string[]>([])
  const [selectedKey, setSelectedKey] = useState("")
  const [keyValue, setKeyValue] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [valueLoading, setValueLoading] = useState(false)

  const searchKeys = async () => {
    setLoading(true)
    try {
      const result = await searchRedisKeys(pattern)
      if (result.success) {
        setKeys(result.keys || [])
      } else {
        console.error(result.error)
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error("Error searching keys:", error)
      alert("An error occurred while searching keys")
    } finally {
      setLoading(false)
    }
  }

  const fetchValue = async (key: string) => {
    setSelectedKey(key)
    setValueLoading(true)
    try {
      const result = await getRedisValue(key)
      if (result.success) {
        setKeyValue(result.value)
      } else {
        console.error(result.error)
        alert(`Error: ${result.error}`)
        setKeyValue(null)
      }
    } catch (error) {
      console.error("Error fetching value:", error)
      alert("An error occurred while fetching the value")
      setKeyValue(null)
    } finally {
      setValueLoading(false)
    }
  }

  const formatValue = (value: any) => {
    if (value === null || value === undefined) {
      return "null"
    }

    if (typeof value === "object") {
      try {
        return JSON.stringify(value, null, 2)
      } catch (e) {
        return String(value)
      }
    }

    return String(value)
  }

  const getKeyType = (key: string) => {
    if (key.includes(":set")) return "Set"
    if (key.includes(":hash")) return "Hash"
    if (key.includes(":list")) return "List"
    return "String"
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Redis Database Browser</h1>

      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Key pattern (e.g., business:* or zipcode:*)"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          className="flex-1"
        />
        <Button onClick={searchKeys} disabled={loading}>
          {loading ? "Searching..." : "Search Keys"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Keys ({keys.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] overflow-y-auto border rounded-md">
              {keys.length === 0 ? (
                <p className="p-4 text-gray-500">No keys found. Try searching with a pattern like "business:*"</p>
              ) : (
                <ul className="divide-y">
                  {keys.map((key) => (
                    <li
                      key={key}
                      className={`p-2 hover:bg-gray-100 cursor-pointer ${selectedKey === key ? "bg-gray-100" : ""}`}
                      onClick={() => fetchValue(key)}
                    >
                      <div className="font-mono text-sm break-all">{key}</div>
                      <div className="text-xs text-gray-500">{getKeyType(key)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Value {selectedKey && `for "${selectedKey}"`}</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedKey ? (
              <p className="text-gray-500">Select a key to view its value</p>
            ) : valueLoading ? (
              <p>Loading value...</p>
            ) : (
              <div className="h-[600px] overflow-y-auto border rounded-md p-4">
                <pre className="font-mono text-sm whitespace-pre-wrap break-all">{formatValue(keyValue)}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

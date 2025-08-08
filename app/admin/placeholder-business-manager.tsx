"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Upload, FileSpreadsheet, Video, CheckCircle2, AlertTriangle } from 'lucide-react'

type ApiResultRow = {
  row: number
  id?: string
  businessName?: string
  zipCode?: string
  categoryPath?: string
  isPlaceholder?: boolean
  status?: "active" | "inactive"
  error?: string
}

const CATEGORY_OPTIONS: { path: string; label: string }[] = [
  { path: "/home-improvement/lawn-garden", label: "Home Improvement — Lawn & Garden" },
  { path: "/home-improvement/outside-maintenance", label: "Home Improvement — Outside Maintenance" },
  { path: "/home-improvement/outdoor-structures", label: "Home Improvement — Outdoor Structures" },
  { path: "/home-improvement/pool-services", label: "Home Improvement — Pool Services" },
  { path: "/home-improvement/asphalt-concrete", label: "Home Improvement — Asphalt & Concrete" },
  { path: "/home-improvement/construction-design", label: "Home Improvement — Construction & Design" },
  { path: "/home-improvement/inside-maintenance", label: "Home Improvement — Inside Maintenance" },
  { path: "/home-improvement/windows-doors", label: "Home Improvement — Windows & Doors" },
  { path: "/home-improvement/flooring", label: "Home Improvement — Flooring" },
  { path: "/home-improvement/audio-visual-security", label: "Home Improvement — Audio/Visual & Security" },
  { path: "/home-improvement/hazard-mitigation", label: "Home Improvement — Hazard Mitigation" },
  { path: "/home-improvement/pest-control", label: "Home Improvement — Pest Control" },
  { path: "/home-improvement/trash-cleanup", label: "Home Improvement — Trash Cleanup" },
  { path: "/home-improvement/cleaning", label: "Home Improvement — Cleaning" },
  { path: "/home-improvement/fireplaces-chimneys", label: "Home Improvement — Fireplaces & Chimneys" },
  { path: "/home-improvement/movers", label: "Home Improvement — Movers" },
  { path: "/home-improvement/handymen", label: "Home Improvement — Handymen" },
  { path: "/automotive-services", label: "Automotive Services" },
  { path: "/care-services", label: "Care Services" },
  { path: "/pet-care", label: "Pet Care" },
  { path: "/weddings-events", label: "Weddings & Events" },
  { path: "/fitness-athletics", label: "Fitness & Athletics" },
  { path: "/education-tutoring", label: "Education & Tutoring" },
  { path: "/music-lessons", label: "Music Lessons" },
  { path: "/real-estate", label: "Real Estate" },
  { path: "/food-dining", label: "Food & Dining" },
  { path: "/retail-stores", label: "Retail Stores" },
  { path: "/legal-services", label: "Legal Services" },
  { path: "/funeral-services", label: "Funeral Services" },
  { path: "/personal-assistants", label: "Personal Assistants" },
  { path: "/travel-vacation", label: "Travel & Vacation" },
  { path: "/tailoring-clothing", label: "Tailoring & Clothing" },
  { path: "/arts-entertainment", label: "Arts & Entertainment" },
  { path: "/tech-it-services", label: "Tech & IT Services" },
  { path: "/beauty-wellness", label: "Beauty & Wellness" },
  { path: "/physical-rehabilitation", label: "Physical Rehabilitation" },
  { path: "/medical-practitioners", label: "Medical Practitioners" },
  { path: "/mental-health", label: "Mental Health" },
  { path: "/financial-services", label: "Financial Services" },
  { path: "/child-care", label: "Child Care" },
  { path: "/elder-care", label: "Elder Care" },
]

const CSV_HEADERS = [
  "Business Name",
  "Phone Number",
  "Business Address",
  "Zip Code",
  "Website",
  "Email",
]

const EXAMPLE_ROW = [
  "Acme Lawn Pros",
  "(555) 123-4567",
  "123 Main St, Springfield",
  "90210",
  "https://acmelawnpros.example.com",
  "contact@acmelawnpros.example.com",
]

export function PlaceholderBusinessManager() {
  const [categoryPath, setCategoryPath] = useState<string>("")
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [results, setResults] = useState<ApiResultRow[]>([])
  const [errors, setErrors] = useState<ApiResultRow[]>([])
  const [serverMessage, setServerMessage] = useState<string | null>(null)

  const templateCsv = useMemo(() => {
    const header = CSV_HEADERS.join(",")
    const example = EXAMPLE_ROW.map((s) => `"${s.replaceAll('"', '""')}"`).join(",")
    return `${header}\n${example}\n`
  }, [])

  const handleDownloadTemplate = () => {
    const blob = new Blob([templateCsv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "placeholder-businesses-template.csv"
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerMessage(null)
    setResults([])
    setErrors([])

    if (!categoryPath) {
      setServerMessage("Please choose a category page to place these placeholder businesses.")
      return
    }
    if (!csvFile) {
      setServerMessage("Please select a CSV file to upload.")
      return
    }

    const fd = new FormData()
    fd.append("categoryPath", categoryPath)
    fd.append("csv", csvFile)
    if (videoFile) {
      fd.append("video", videoFile)
    }

    setIsUploading(true)
    try {
      const res = await fetch("/api/admin/placeholder-businesses", {
        method: "POST",
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) {
        setServerMessage(data?.message || "Upload failed.")
        setErrors(data?.errors || [])
        return
      }
      setServerMessage(data?.message || "Processed CSV.")
      setResults(data?.results || [])
      setErrors(data?.errors || [])
    } catch (err) {
      setServerMessage("Unexpected error uploading CSV.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Manage Placeholder Businesses
        </CardTitle>
        <CardDescription>Upload CSV and optionally set a default video for all new placeholders. All entries will be indexed to show on the chosen category page and its subcategories.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* CSV Structure */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            CSV structure
          </h3>
          <p className="text-sm text-muted-foreground">
            Include the following columns in this exact order. Bold items are required.
          </p>
          <ul className="list-disc pl-6 text-sm space-y-1">
            <li><strong>Business Name</strong> (mandatory) - The name of the business.</li>
            <li><strong>Phone Number</strong> (mandatory) - The contact number for the business.</li>
            <li><strong>Business Address</strong> (mandatory) - The physical address of the business.</li>
            <li><strong>Zip Code</strong> (mandatory) - The postal code for the business location.</li>
            <li>Website (optional) - The business's website URL.</li>
            <li>Email (optional) - The contact email for the business.</li>
          </ul>
          <div className="rounded-md border bg-muted/40 p-3">
            <div className="text-xs font-mono whitespace-pre overflow-x-auto">
              {CSV_HEADERS.join(",") + "\n" + EXAMPLE_ROW.map((s) => `"${s.replaceAll('"', '""')}"`).join(",")}
            </div>
          </div>
          <Button variant="secondary" onClick={handleDownloadTemplate} className="mt-2">
            Download CSV template
          </Button>
        </div>

        {/* Controls */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category Page</Label>
              <select
                id="category"
                value={categoryPath}
                onChange={(e) => setCategoryPath(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select a category page...</option>
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.path} value={opt.path}>{opt.label}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                All businesses in this CSV will be placed on the selected category page.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="csv">CSV file</Label>
              <Input
                id="csv"
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video">Default video (optional)</Label>
              <Input
                id="video"
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Video className="h-3 w-3" />
                The latest uploaded video becomes the default for new placeholders.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload CSV"}
            </Button>
            {serverMessage && (
              <div className="text-sm text-muted-foreground self-center">{serverMessage}</div>
            )}
          </div>
        </form>

        {/* Results */}
        {(results.length > 0 || errors.length > 0) && (
          <div className="space-y-6">
            {results.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Created placeholders ({results.length})
                </h4>
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-2">Row</th>
                        <th className="text-left p-2">Business ID</th>
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Zip</th>
                        <th className="text-left p-2">Category</th>
                        <th className="text-left p-2">Type</th>
                        <th className="text-left p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r) => (
                        <tr key={`${r.row}-${r.id}`}>
                          <td className="p-2">{r.row}</td>
                          <td className="p-2 font-mono">{r.id}</td>
                          <td className="p-2">{r.businessName}</td>
                          <td className="p-2">{r.zipCode}</td>
                          <td className="p-2">{r.categoryPath}</td>
                          <td className="p-2">
                            {r.isPlaceholder ? (
                              <Badge variant="secondary">Placeholder</Badge>
                            ) : (
                              <Badge>Registered</Badge>
                            )}
                          </td>
                          <td className="p-2">{r.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  Errors ({errors.length})
                </h4>
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-2">Row</th>
                        <th className="text-left p-2">Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {errors.map((e) => (
                        <tr key={`err-${e.row}-${e.error}`}>
                          <td className="p-2">{e.row}</td>
                          <td className="p-2">{e.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PlaceholderBusinessManager

"use client"

import { useState } from "react"
import { MainHeader } from "@/components/main-header"
import { MainFooter } from "@/components/main-footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
// Import the Dialog components at the top of the file
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function AdDesignPage() {
  const router = useRouter()
  const [selectedDesign, setSelectedDesign] = useState<number | null>(null)
  const [isColorModalOpen, setIsColorModalOpen] = useState(false)
  const [selectedColor, setSelectedColor] = useState<string>("blue")

  // Add state for the new dialogs after the existing state declarations
  const [isSavingsDialogOpen, setIsSavingsDialogOpen] = useState(false)
  const [isJobsDialogOpen, setIsJobsDialogOpen] = useState(false)

  // Color options for the designs
  const colorOptions = [
    { value: "blue", label: "Blue", primary: "#007BFF", secondary: "#0056b3" },
    { value: "purple", label: "Purple", primary: "#6f42c1", secondary: "#5e37a6" },
    { value: "green", label: "Green", primary: "#28a745", secondary: "#218838" },
    { value: "teal", label: "Teal", primary: "#20c997", secondary: "#17a2b8" },
    { value: "orange", label: "Orange", primary: "#fd7e14", secondary: "#e65f02" },
    { value: "red", label: "Red", primary: "#dc3545", secondary: "#c82333" },
    { value: "black", label: "Black", primary: "#000000", secondary: "#333333" },
    { value: "slategrey", label: "Slate Grey", primary: "#708090", secondary: "#4E5964" },
    { value: "brown", label: "Brown", primary: "#8B4513", secondary: "#6B3610" },
  ]

  // Add sample coupons data after the colorOptions array
  const sampleCoupons = [
    {
      id: "1",
      businessName: "Business Name",
      title: "Summer Special",
      discount: "20% OFF",
      description: "Get 20% off on all summer products",
      code: "SUMMER20",
      startDate: "2025-06-01",
      expirationDate: "2025-08-31",
      terms: "No cash value. Cannot be combined with other offers.",
    },
    {
      id: "2",
      businessName: "Business Name",
      title: "New Customer",
      discount: "$10 OFF",
      description: "First-time customers get $10 off their purchase",
      code: "NEWCUST10",
      startDate: "2025-01-01",
      expirationDate: "2025-12-31",
      terms: "Valid for first-time customers only.",
    },
  ]

  // Add sample jobs data
  const sampleJobs = [
    {
      id: "1",
      title: "Sales Associate",
      description: "Looking for an energetic sales associate to join our team.",
      requirements: "Previous retail experience preferred. Strong communication skills required.",
      salary: "$15-18/hour",
      location: "In-store",
    },
    {
      id: "2",
      title: "Marketing Specialist",
      description: "Help us grow our brand with creative marketing campaigns.",
      requirements: "Bachelor's degree in Marketing or related field. 2+ years experience.",
      salary: "$45,000-55,000/year",
      location: "Hybrid (Remote/Office)",
    },
  ]

  // Handle design selection
  const handleDesignSelect = (designId: number, color = "blue") => {
    // Save to localStorage for client-side persistence
    localStorage.setItem("hausbaum_selected_design", designId.toString())
    localStorage.setItem("hausbaum_selected_color", color)

    // Redirect to customize page
    router.push(`/ad-design/customize?design=${designId}&color=${color}`)
  }

  // Handle color selection and navigation to customize page
  const handleContinue = () => {
    if (selectedDesign) {
      // Save the selected design and color to localStorage
      localStorage.setItem("hausbaum_selected_design", selectedDesign.toString())
      localStorage.setItem("hausbaum_selected_color", selectedColor)

      router.push(`/ad-design/customize?design=${selectedDesign}&color=${selectedColor}`)
    }
  }

  // Define colorValues based on selectedColor
  const colorValues = colorOptions.find((color) => color.value === selectedColor) || colorOptions[0]

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">AdBox Design</h1>
            <p className="text-gray-600">
              Choose a design template for your AdBox. Each includes areas for your business information and a video
              space.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            {/* Design 1 (formerly Design 6) */}
            <div
              className={`cursor-pointer transition-all ${
                selectedDesign === 1 ? "ring-4 ring-primary rounded-lg" : "hover:shadow-lg"
              }`}
              onClick={() => handleDesignSelect(1)}
            >
              <div className="overflow-hidden rounded-lg shadow-md">
                <Card className="relative overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-200 to-gray-300 p-5 text-gray-800">
                    <h3 className="text-xl font-bold text-center">Business Name</h3>
                  </div>
                  <div className="p-6 bg-gradient-to-b from-white to-gray-50">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-600"
                          >
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Address</p>
                          <p className="text-sm text-gray-600">123 Business St, City, ST 12345</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-600"
                          >
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Phone</p>
                          <p className="text-sm text-gray-600">(555) 123-4567</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-600"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Hours</p>
                          <p className="text-sm text-gray-600">Mon-Fri: 9AM-5PM</p>
                          <p className="text-sm text-gray-600">Sat: 10AM-3PM</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-600"
                          >
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Website</p>
                          <p className="text-sm text-gray-600 underline">www.businessname.com</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-600"
                          >
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                            <circle cx="9" cy="9" r="2"></circle>
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Photo Album</p>
                          <p className="text-sm text-gray-600 underline">Browse Photos</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Free Text Section */}
                  <div className="w-full bg-white p-3 text-center border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-600">
                      We offer professional services with 10+ years of experience in the industry.
                    </p>
                  </div>

                  {/* Video Player - Positioned absolutely on larger screens */}
                  <div className="hidden lg:block absolute top-1/2 right-4 transform -translate-y-1/2 w-[220px] h-[392px] bg-white rounded-lg border-2 border-gray-300 shadow-lg overflow-hidden">
                    <div className="relative w-full h-full">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-gradient-to-r from-gray-400 to-gray-500 rounded-full p-3 shadow-lg">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-white"
                          >
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                          </svg>
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-0 right-0 text-center">
                        <p className="text-sm font-medium text-gray-700">Video Preview</p>
                        <p className="text-xs text-gray-600">9:16 ratio</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-300 text-center">
                    <p className="font-medium text-gray-800">Design 1</p>
                  </div>
                  <div className="flex justify-center gap-4 p-4 bg-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsSavingsDialogOpen(true)
                      }}
                      className="flex items-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-tag"
                      >
                        <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
                        <path d="M7 7h.01" />
                      </svg>
                      Savings
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsJobsDialogOpen(true)
                      }}
                      className="flex items-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-briefcase"
                      >
                        <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                      Job Opportunities
                    </Button>
                  </div>
                </Card>

                {/* Video Space for Mobile - Only shown on small screens */}
                <div className="lg:hidden w-full bg-gradient-to-b from-gray-100 to-gray-200 rounded-b-lg overflow-hidden flex items-center justify-center">
                  <div className="relative w-full py-6">
                    <div className="mx-auto w-[220px] h-[392px] bg-white rounded-lg border-2 border-gray-300 flex flex-col items-center justify-center">
                      <div className="relative w-full h-full">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-gradient-to-r from-gray-400 to-gray-500 rounded-full p-3 shadow-lg">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="32"
                              height="32"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-white"
                            >
                              <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                          </div>
                        </div>
                        <div className="absolute bottom-4 left-0 right-0 text-center">
                          <p className="text-sm font-medium text-gray-700">Video Preview</p>
                          <p className="text-xs text-gray-600">9:16 ratio</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Design 2 (formerly Design 7) */}
            <div
              className={`cursor-pointer transition-all ${
                selectedDesign === 2 ? "ring-4 ring-primary rounded-lg" : "hover:shadow-lg"
              }`}
              onClick={() => handleDesignSelect(2)}
            >
              <div className="overflow-hidden rounded-lg shadow-md">
                <Card className="relative overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-200 to-gray-300 p-5 text-gray-800">
                    <h3 className="text-xl font-bold text-center">Business Name</h3>
                  </div>

                  {/* Landscape Video Player - Top section */}
                  <div className="w-full bg-gradient-to-b from-gray-100 to-gray-50 p-4">
                    <div className="relative mx-auto w-full max-w-[392px] h-auto aspect-video bg-white rounded-lg border-2 border-gray-300 shadow-lg overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-gradient-to-r from-gray-400 to-gray-500 rounded-full p-3 shadow-lg">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-white"
                          >
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                          </svg>
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        16:9 ratio
                      </div>
                    </div>
                  </div>

                  {/* Business Info Section */}
                  <div className="p-6 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg shadow-sm">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-600"
                          >
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Address</p>
                          <p className="text-sm text-gray-600">123 Business St, City, ST 12345</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg shadow-sm">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-600"
                          >
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Phone</p>
                          <p className="text-sm text-gray-600">(555) 123-4567</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg shadow-sm">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-600"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Hours</p>
                          <p className="text-sm text-gray-600">Mon-Fri: 9AM-5PM</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg shadow-sm">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-600"
                          >
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Website</p>
                          <p className="text-sm text-gray-600 underline">www.businessname.com</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg shadow-sm md:col-span-2">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-600"
                          >
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                            <circle cx="9" cy="9" r="2"></circle>
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Photo Album</p>
                          <p className="text-sm text-gray-600 underline">Browse Photos</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Free Text Section */}
                  <div className="w-full bg-white p-3 text-center border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-600">
                      We offer professional services with 10+ years of experience in the industry.
                    </p>
                  </div>

                  <div className="p-3 bg-gray-300 text-center">
                    <p className="font-medium text-gray-800">Design 2</p>
                  </div>
                  <div className="flex justify-center gap-4 p-4 bg-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsSavingsDialogOpen(true)
                      }}
                      className="flex items-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-tag"
                      >
                        <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
                        <path d="M7 7h.01" />
                      </svg>
                      Savings
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsJobsDialogOpen(true)
                      }}
                      className="flex items-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-briefcase"
                      >
                        <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                      Job Opportunities
                    </Button>
                  </div>
                </Card>
              </div>
            </div>

            {/* Design 3 (formerly Design 9) */}
            <div
              className={`cursor-pointer transition-all ${
                selectedDesign === 3 ? "ring-4 ring-primary rounded-lg" : "hover:shadow-lg"
              }`}
              onClick={() => handleDesignSelect(3)}
            >
              <div className="overflow-hidden rounded-lg shadow-md">
                <Card className="relative overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-200 to-gray-300 p-5 text-gray-800">
                    <h3 className="text-xl font-bold text-center">Business Name</h3>
                  </div>

                  {/* Business Info Section - Top section */}
                  <div className="p-6 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg shadow-sm">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-600"
                          >
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Address</p>
                          <p className="text-sm text-gray-600">123 Business St, City, ST 12345</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg shadow-sm">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-600"
                          >
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Phone</p>
                          <p className="text-sm text-gray-600">(555) 123-4567</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg shadow-sm">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-600"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Hours</p>
                          <p className="text-sm text-gray-600">Mon-Fri: 9AM-5PM</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg shadow-sm">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-600"
                          >
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Website</p>
                          <p className="text-sm text-gray-600 underline">www.businessname.com</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg shadow-sm md:col-span-2">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-600"
                          >
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                            <circle cx="9" cy="9" r="2"></circle>
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Photo Album</p>
                          <p className="text-sm text-gray-600 underline">Browse Photos</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Free Text Section */}
                  <div className="w-full bg-white p-3 text-center border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-600">
                      We offer professional services with 10+ years of experience in the industry.
                    </p>
                  </div>

                  {/* Landscape Video Player - Bottom section */}
                  <div className="w-full bg-gradient-to-b from-gray-50 to-gray-100 p-4">
                    <div className="relative mx-auto w-full max-w-[392px] h-auto aspect-video bg-white rounded-lg border-2 border-gray-300 shadow-lg overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-gradient-to-r from-gray-400 to-gray-500 rounded-full p-3 shadow-lg">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-white"
                          >
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                          </svg>
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        16:9 ratio
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-300 text-center">
                    <p className="font-medium text-gray-800">Design 3</p>
                  </div>
                  <div className="flex justify-center gap-4 p-4 bg-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsSavingsDialogOpen(true)
                      }}
                      className="flex items-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-tag"
                      >
                        <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
                        <path d="M7 7h.01" />
                      </svg>
                      Savings
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsJobsDialogOpen(true)
                      }}
                      className="flex items-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-briefcase"
                      >
                        <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                      Job Opportunities
                    </Button>
                  </div>
                </Card>
              </div>
            </div>

            {/* Design 4 (formerly Design 8) - Hidden on mobile/small screens */}
            <div
              className={`hidden md:block cursor-pointer transition-all ${
                selectedDesign === 4 ? "ring-4 ring-primary rounded-lg" : "hover:shadow-lg"
              }`}
              onClick={() => handleDesignSelect(4)}
            >
              <div className="overflow-hidden rounded-lg shadow-md">
                <Card className="relative overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-200 to-gray-300 p-5 text-gray-800">
                    <h3 className="text-xl font-bold text-center">Business Name</h3>
                  </div>
                  <div className="p-6 bg-gradient-to-b from-white to-gray-50">
                    {/* Video Player - Positioned absolutely on larger screens (LEFT SIDE) */}
                    <div className="hidden lg:block absolute top-1/2 left-4 transform -translate-y-1/2 w-[220px] h-[392px] bg-white rounded-lg border-2 border-gray-300 shadow-lg overflow-hidden">
                      <div className="relative w-full h-full">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-gradient-to-r from-gray-400 to-gray-500 rounded-full p-3 shadow-lg">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="32"
                              height="32"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-white"
                            >
                              <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                          </div>
                        </div>
                        <div className="absolute bottom-4 left-0 right-0 text-center">
                          <p className="text-sm font-medium text-gray-700">Video Preview</p>
                          <p className="text-xs text-gray-600">9:16 ratio</p>
                        </div>
                      </div>
                    </div>

                    {/* Business info shifted to the right */}
                    <div className="space-y-4 lg:ml-[240px]">
                      <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-600"
                          >
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Address</p>
                          <p className="text-sm text-gray-600">123 Business St, City, ST 12345</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-600"
                          >
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Phone</p>
                          <p className="text-sm text-gray-600">(555) 123-4567</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-600"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Hours</p>
                          <p className="text-sm text-gray-600">Mon-Fri: 9AM-5PM</p>
                          <p className="text-sm text-gray-600">Sat: 10AM-3PM</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-600"
                          >
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Website</p>
                          <p className="text-sm text-gray-600 underline">www.businessname.com</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-600"
                          >
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                            <circle cx="9" cy="9" r="2"></circle>
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Photo Album</p>
                          <p className="text-sm text-gray-600 underline">Browse Photos</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Free Text Section */}
                  <div className="w-full bg-white p-3 text-center border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-600">
                      We offer professional services with 10+ years of experience in the industry.
                    </p>
                  </div>

                  <div className="p-3 bg-gray-300 text-center">
                    <p className="font-medium text-gray-800">Design 4</p>
                  </div>
                  <div className="flex justify-center gap-4 p-4 bg-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsSavingsDialogOpen(true)
                      }}
                      className="flex items-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-tag"
                      >
                        <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
                        <path d="M7 7h.01" />
                      </svg>
                      Savings
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsJobsDialogOpen(true)
                      }}
                      className="flex items-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-briefcase"
                      >
                        <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                      Job Opportunities
                    </Button>
                  </div>
                </Card>

                {/* Video Space for Mobile - Only shown on small screens */}
                <div className="lg:hidden w-full bg-gradient-to-b from-gray-100 to-gray-200 rounded-b-lg overflow-hidden flex items-center justify-center">
                  <div className="relative w-full py-6">
                    <div className="mx-auto w-[220px] h-[392px] bg-white rounded-lg border-2 border-gray-300 flex flex-col items-center justify-center">
                      <div className="relative w-full h-full">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-gradient-to-r from-gray-400 to-gray-500 rounded-full p-3 shadow-lg">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="32"
                              height="32"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-white"
                            >
                              <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                          </div>
                        </div>
                        <div className="absolute bottom-4 left-0 right-0 text-center">
                          <p className="text-sm font-medium text-gray-700">Video Preview</p>
                          <p className="text-xs text-gray-600">9:16 ratio</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Color Selection Modal */}
      <Dialog open={isColorModalOpen} onOpenChange={setIsColorModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose a Color Theme</DialogTitle>
          </DialogHeader>

          <div className="py-6">
            <RadioGroup value={selectedColor} onValueChange={setSelectedColor} className="grid grid-cols-2 gap-4">
              {colorOptions.map((color) => (
                <div key={color.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={color.value} id={color.value} />
                  <Label htmlFor={color.value} className="flex items-center gap-2 cursor-pointer">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: color.primary }}></div>
                    {color.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsColorModalOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleContinue}>Continue to Customization</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Savings Dialog */}
      <Dialog open={isSavingsDialogOpen} onOpenChange={setIsSavingsDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Savings & Coupons</DialogTitle>
          </DialogHeader>

          <div className="py-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-6">
              {sampleCoupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="relative bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center">
                    <div className="md:w-1/3 text-center mb-4 md:mb-0">
                      <h4 className="font-bold text-xl text-teal-700 mb-2">{coupon.businessName}</h4>
                      <div className="text-3xl font-extrabold text-red-600">{coupon.discount}</div>
                      <div className="font-bold text-xl mt-1">{coupon.title}</div>
                    </div>

                    <div className="md:w-2/3 md:pl-6 md:border-l border-gray-200">
                      <div className="text-lg mb-3">{coupon.description}</div>

                      {coupon.code && (
                        <div className="mb-3">
                          <span className="inline-block bg-gray-100 px-3 py-1 rounded font-mono">
                            Code: {coupon.code}
                          </span>
                        </div>
                      )}

                      <div className="text-sm text-gray-600 mt-4">
                        Valid: {new Date(coupon.startDate).toLocaleDateString()} -{" "}
                        {new Date(coupon.expirationDate).toLocaleDateString()}
                      </div>

                      <div className="text-sm text-gray-500 mt-1 italic">{coupon.terms}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSavingsDialogOpen(false)}>
              Close
            </Button>
            <Link href="/coupons">
              <Button>View All Coupons</Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Jobs Dialog */}
      <Dialog open={isJobsDialogOpen} onOpenChange={setIsJobsDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Job Opportunities</DialogTitle>
          </DialogHeader>

          <div className="py-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-6">
              {sampleJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-xl font-bold text-teal-700 mb-2">{job.title}</h3>
                  <p className="mb-3">{job.description}</p>

                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">Requirements:</p>
                    <p className="text-gray-700">{job.requirements}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">{job.salary}</div>
                    <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">{job.location}</div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button size="sm">Apply Now</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsJobsDialogOpen(false)}>
              Close
            </Button>
            <Link href="/job-listing">
              <Button>View All Jobs</Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MainFooter />
    </div>
  )
}

"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, X, Upload, Eye, Info, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MainHeader } from "@/components/main-header"
import { MainFooter } from "@/components/main-footer"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { saveJobListing } from "@/app/actions/job-actions"
import { toast } from "@/components/ui/use-toast"
import { getCurrentBusiness } from "@/app/actions/auth-actions"

export default function JobListingPage() {
  const [payType, setPayType] = useState<string | null>(null)
  const [benefits, setBenefits] = useState<Record<string, boolean>>({})
  const [benefitDetails, setBenefitDetail] = useState<Record<string, string>>({})
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  // Add state for confirmation dialog
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  // Add state for business ID dialog
  const [isBusinessIdDialogOpen, setIsBusinessIdDialogOpen] = useState(false)
  const [businessId, setBusinessId] = useState<string>("demo-business") // Default business ID
  const [savedJobId, setSavedJobId] = useState<string | null>(null) // To store the saved job ID
  const [showDebugInfo, setShowDebugInfo] = useState(false) // For debugging

  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  // Load business ID from localStorage on mount
  useEffect(() => {
    // Load business ID from localStorage on mount and check for logged-in business
    const fetchBusinessId = async () => {
      try {
        // First try to get the logged-in business
        const loggedInBusiness = await getCurrentBusiness()

        if (loggedInBusiness && loggedInBusiness.id) {
          console.log("Using logged-in business ID:", loggedInBusiness.id)
          setBusinessId(loggedInBusiness.id)
          return
        }

        // Fall back to localStorage if no logged-in business
        const storedBusinessId = localStorage.getItem("hausbaum_business_id")
        if (storedBusinessId) {
          console.log("Loaded business ID from localStorage:", storedBusinessId)
          setBusinessId(storedBusinessId)
        } else {
          console.log("No business ID found in localStorage, using default:", businessId)
        }
      } catch (error) {
        console.error("Error loading business ID:", error)
      }
    }

    fetchBusinessId()
  }, [])

  const [formValues, setFormValues] = useState({
    jobTitle: "Marketing Specialist",
    jobDescription:
      "We are seeking a talented Marketing Specialist to join our growing team. The ideal candidate will have experience in digital marketing, content creation, and campaign management.",
    qualifications:
      "Bachelor's degree in Marketing or related field, 2+ years of experience, proficient in social media platforms and analytics tools.",
    businessName: "Acme Corporation",
    businessDescription:
      "Acme Corporation is a leading provider of innovative solutions in the technology sector. Founded in 2010, we have been helping businesses transform their digital presence.",
    businessAddress: "123 Business Avenue, Suite 200, San Francisco, CA 94107",
    workHours: "Monday-Friday, 9:00 AM - 5:00 PM",
    contactEmail: "careers@acmecorp.com",
    contactName: "Jane Smith, HR Manager",
  })

  // First, add state variables to track payment values after the existing useState declarations
  const [paymentValues, setPaymentValues] = useState({
    hourlyMin: "",
    hourlyMax: "",
    salaryMin: "",
    salaryMax: "",
    otherPay: "",
  })

  // Function to toggle category selection
  const toggleCategorySelection = (categoryTitle: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryTitle) ? prev.filter((cat) => cat !== categoryTitle) : [...prev, categoryTitle],
    )
  }

  // Function to toggle benefits
  const toggleBenefit = (benefit: string) => {
    setBenefits((prev) => ({
      ...prev,
      [benefit]: !prev[benefit],
    }))
  }

  // Function to update benefit details
  const updateBenefitDetail = (benefit: string, detail: string) => {
    setBenefitDetail((prev) => ({
      ...prev,
      [benefit]: detail,
    }))
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoFile(file)

      // Create preview URL
      const reader = new FileReader()
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Add this new function to remove the logo
  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormValues((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  // Add a handler function for payment input changes after the handleInputChange function
  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setPaymentValues((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  // Function to save the business ID
  const saveBusinessId = () => {
    try {
      // Save to localStorage for persistence
      localStorage.setItem("hausbaum_business_id", businessId)
      console.log("Saved business ID to localStorage:", businessId)
      setIsBusinessIdDialogOpen(false)
      toast({
        title: "Business ID Saved",
        description: `Using business ID: ${businessId}`,
      })
    } catch (error) {
      console.error("Error saving business ID to localStorage:", error)
      toast({
        title: "Error Saving Business ID",
        description: "Could not save business ID to localStorage",
        variant: "destructive",
      })
    }
  }

  // Update the handleSaveJobListing function to show confirmation dialog
  const handleSaveJobListing = async () => {
    if (selectedCategories.length === 0) {
      toast({
        title: "Categories Required",
        description: "Please select at least one job category before saving.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      // First try to get the logged-in business ID
      let currentBusinessId = businessId
      try {
        const loggedInBusiness = await getCurrentBusiness()
        if (loggedInBusiness && loggedInBusiness.id) {
          currentBusinessId = loggedInBusiness.id
          console.log(`Using logged-in business ID for job listing: ${currentBusinessId}`)
        }
      } catch (error) {
        console.error("Error getting logged-in business:", error)
        // Continue with the current businessId from state
      }

      // If still no business ID, use the one from state
      if (!currentBusinessId) {
        currentBusinessId = businessId || "demo-business"
        console.log(`Using business ID from state for job listing: ${currentBusinessId}`)
      }

      // Create FormData object
      const formData = new FormData()

      // Format benefits for storage
      const formattedBenefits: Record<string, { enabled: boolean; details?: string }> = {}
      Object.keys(benefits).forEach((key) => {
        formattedBenefits[key] = {
          enabled: benefits[key] || false,
          details: benefitDetails[key],
        }
      })

      // Prepare job data
      const jobData = {
        // Basic job details
        jobTitle: formValues.jobTitle,
        jobDescription: formValues.jobDescription,
        qualifications: formValues.qualifications,
        businessName: formValues.businessName,
        businessDescription: formValues.businessDescription,
        businessAddress: formValues.businessAddress,
        workHours: formValues.workHours,
        contactEmail: formValues.contactEmail,
        contactName: formValues.contactName,

        // Pay details
        payType,
        hourlyMin: paymentValues.hourlyMin,
        hourlyMax: paymentValues.hourlyMax,
        salaryMin: paymentValues.salaryMin,
        salaryMax: paymentValues.salaryMax,
        otherPay: paymentValues.otherPay,

        // Categories
        categories: selectedCategories,

        // Benefits
        benefits: formattedBenefits,
      }

      formData.append("jobData", JSON.stringify(jobData))

      // Add logo file if available
      if (logoFile) {
        formData.append("logo", logoFile)
      }

      // Call the server action with the current business ID
      const result = await saveJobListing(formData, currentBusinessId)

      if (result.success) {
        // Store the job ID for debugging
        if (result.jobId) {
          setSavedJobId(result.jobId)
        }

        // Show confirmation dialog
        setIsConfirmationOpen(true)
      } else {
        toast({
          title: "Error Saving Job Listing",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving job listing:", error)
      toast({
        title: "Error Saving Job Listing",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Job categories data
  const jobCategories = [
    {
      title: "Office Work",
      description: "Administrative, clerical, customer service, and other office-based positions",
      icon: "📊",
      href: "/job-listings/office-work",
      color: "bg-blue-100",
    },
    {
      title: "Factory Work",
      description: "Manufacturing, assembly line, production, and warehouse positions",
      icon: "🏭",
      href: "/job-listings/factory-work",
      color: "bg-yellow-100",
    },
    {
      title: "Manual Labor",
      description: "Construction, landscaping, moving, and other physical labor positions",
      icon: "🔨",
      href: "/job-listings/manual-labor",
      color: "bg-orange-100",
    },
    {
      title: "Medical",
      description: "Healthcare, nursing, medical administration, and other healthcare positions",
      icon: "🏥",
      href: "/job-listings/medical",
      color: "bg-red-100",
    },
    {
      title: "Non-Medical Care Givers",
      description: "Elderly care, childcare, companion care, and other non-medical caregiving roles",
      icon: "👨‍👩‍👧",
      href: "/job-listings/non-medical-care",
      color: "bg-pink-100",
    },
    {
      title: "Food Service",
      description: "Restaurant, catering, food preparation, and hospitality positions",
      icon: "🍽️",
      href: "/job-listings/food-service",
      color: "bg-green-100",
    },
    {
      title: "Retail",
      description: "Sales, cashier, merchandising, and customer-facing retail positions",
      icon: "🛍️",
      href: "/job-listings/retail",
      color: "bg-purple-100",
    },
    {
      title: "Transportation",
      description: "Driving, delivery, logistics, and transportation-related positions",
      icon: "🚚",
      href: "/job-listings/transportation",
      color: "bg-indigo-100",
    },
    {
      title: "Education",
      description: "Teaching, tutoring, administration, and other education-related positions",
      icon: "🎓",
      href: "/job-listings/education",
      color: "bg-teal-100",
    },
    {
      title: "Technology",
      description: "IT, software development, technical support, and other tech positions",
      icon: "💻",
      href: "/job-listings/technology",
      color: "bg-cyan-100",
    },
    {
      title: "Professional Services",
      description: "Legal, accounting, consulting, and other professional service positions",
      icon: "👔",
      href: "/job-listings/professional-services",
      color: "bg-pink-100",
    },
    {
      title: "Skilled Trades",
      description: "Electrician, plumber, carpenter, and other skilled trade positions",
      icon: "🔧",
      href: "/job-listings/skilled-trades",
      color: "bg-amber-100",
    },
    {
      title: "Arts & Entertainment",
      description: "Performing arts, music, design, media production, and creative positions",
      icon: "🎭",
      href: "/job-listings/arts-entertainment",
      color: "bg-fuchsia-100",
    },
    {
      title: "Protection Services",
      description: "Security, law enforcement, fire protection, and safety-related positions",
      icon: "🛡️",
      href: "/job-listings/protection-services",
      color: "bg-slate-100",
    },
    {
      title: "Agriculture & Animal Care",
      description: "Farming, livestock, veterinary assistance, and animal handling positions",
      icon: "🌱",
      href: "/job-listings/agriculture-animal-care",
      color: "bg-lime-100",
    },
    {
      title: "Charity Services",
      description: "Non-profit, volunteer coordination, fundraising, and community outreach roles",
      icon: "🤝",
      href: "/job-listings/charity-services",
      color: "bg-rose-100",
    },
    {
      title: "Part-Time & Seasonal",
      description: "Temporary, seasonal, and part-time positions across various industries",
      icon: "⏱️",
      href: "/job-listings/part-time-seasonal",
      color: "bg-lime-100",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Job Listing Workbench</h1>

          {/* Add business ID display and edit button */}
          <div className="flex justify-center items-center gap-2 mb-4">
            <div className="text-sm text-gray-600">
              Current Business ID: <span className="font-medium">{businessId}</span>
              <span className="ml-2 text-xs text-green-600">(Using logged-in business)</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBusinessIdDialogOpen(true)}
              className="flex items-center gap-1 text-xs"
            >
              <Edit className="h-3 w-3" /> Change
            </Button>
          </div>

          <p className="text-center text-gray-600 mb-8">
            To create a job listing, please complete the form, save your submission, and select the categories where you
            would like it to appear.
          </p>

          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-60 h-30">
                  <Image src="/hausbaumbiz03.png" alt="Hausbaum Logo" fill style={{ objectFit: "contain" }} priority />
                </div>
              </div>

              <form className="space-y-6" ref={formRef}>
                {/* Basic Job Fields */}
                <div>
                  <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title:
                  </label>
                  <input
                    type="text"
                    id="jobTitle"
                    value={formValues.jobTitle}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-1">
                    Job Description:
                  </label>
                  <textarea
                    id="jobDescription"
                    rows={4}
                    value={formValues.jobDescription}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="qualifications" className="block text-sm font-medium text-gray-700 mb-1">
                    Needed Qualifications:
                  </label>
                  <input
                    type="text"
                    id="qualifications"
                    value={formValues.qualifications}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name:
                  </label>
                  <input
                    type="text"
                    id="businessName"
                    value={formValues.businessName}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  />
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo (Optional)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {logoPreview ? (
                      <div className="relative">
                        <div className="flex justify-center mb-2">
                          <div className="relative h-40 max-w-xs mx-auto">
                            <img
                              src={logoPreview || "/placeholder.svg"}
                              alt="Company logo preview"
                              className="h-full mx-auto object-contain"
                            />
                          </div>
                        </div>
                        <p className="text-sm text-center text-gray-500 mb-2">
                          {logoFile?.name} ({Math.round(logoFile?.size / 1024)} KB)
                        </p>
                        <div className="flex justify-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveLogo}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Remove Logo
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-2">
                          <label htmlFor="logo-upload" className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-primary hover:text-primary/90">
                              Click to upload a logo
                            </span>
                            <input
                              id="logo-upload"
                              name="logo"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleLogoUpload}
                            />
                            <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">This logo will appear at the top of your job listing.</p>
                </div>

                <div>
                  <label htmlFor="businessDescription" className="block text-sm font-medium text-gray-700 mb-1">
                    Business Description:
                  </label>
                  <textarea
                    id="businessDescription"
                    rows={4}
                    value={formValues.businessDescription}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="businessAddress" className="block text-sm font-medium text-gray-700 mb-1">
                    Business Address:
                  </label>
                  <input
                    type="text"
                    id="businessAddress"
                    value={formValues.businessAddress}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label htmlFor="workHours" className="block text-sm font-medium text-gray-700 mb-1">
                    Work Hours:
                  </label>
                  <input
                    type="text"
                    id="workHours"
                    value={formValues.workHours}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  />
                </div>

                {/* Pay Type */}
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">Pay Type:</span>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="payType"
                        value="hourly"
                        checked={payType === "hourly"}
                        onChange={() => setPayType("hourly")}
                        className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                      />
                      <span className="ml-2 text-sm text-gray-700">Hourly</span>
                    </label>

                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="payType"
                        value="salary"
                        checked={payType === "salary"}
                        onChange={() => setPayType("salary")}
                        className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                      />
                      <span className="ml-2 text-sm text-gray-700">Salary</span>
                    </label>

                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="payType"
                        value="other"
                        checked={payType === "other"}
                        onChange={() => setPayType("other")}
                        className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                      />
                      <span className="ml-2 text-sm text-gray-700">Other</span>
                    </label>
                  </div>
                </div>

                {/* Conditional Pay Fields */}
                {payType === "hourly" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="hourlyMin" className="block text-sm font-medium text-gray-700 mb-1">
                        Min Hourly Rate:
                      </label>
                      <input
                        type="text"
                        id="hourlyMin"
                        value={paymentValues.hourlyMin}
                        onChange={handlePaymentChange}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor="hourlyMax" className="block text-sm font-medium text-gray-700 mb-1">
                        Max Hourly Rate:
                      </label>
                      <input
                        type="text"
                        id="hourlyMax"
                        value={paymentValues.hourlyMax}
                        onChange={handlePaymentChange}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                )}

                {payType === "salary" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="salaryMin" className="block text-sm font-medium text-gray-700 mb-1">
                        Min Salary:
                      </label>
                      <input
                        type="text"
                        id="salaryMin"
                        value={paymentValues.salaryMin}
                        onChange={handlePaymentChange}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor="salaryMax" className="block text-sm font-medium text-gray-700 mb-1">
                        Max Salary:
                      </label>
                      <input
                        type="text"
                        id="salaryMax"
                        value={paymentValues.salaryMax}
                        onChange={handlePaymentChange}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                )}

                {payType === "other" && (
                  <div>
                    <label htmlFor="otherPay" className="block text-sm font-medium text-gray-700 mb-1">
                      Pay Details:
                    </label>
                    <input
                      type="text"
                      id="otherPay"
                      placeholder="e.g., Commission, Stipend, etc."
                      value={paymentValues.otherPay}
                      onChange={handlePaymentChange}
                      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                    />
                  </div>
                )}

                {/* Benefits */}
                <div>
                  <span className="block text-lg font-medium text-gray-700 mb-4">Benefits Offered:</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Individual Health Insurance */}
                    <div className="space-y-2">
                      <label className="inline-flex items-start">
                        <input
                          type="checkbox"
                          checked={benefits["individualHealth"] || false}
                          onChange={() => toggleBenefit("individualHealth")}
                          className="h-4 w-4 mt-1 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="ml-2 text-sm text-gray-700">Individual Health Insurance</span>
                      </label>
                      {benefits["individualHealth"] && (
                        <input
                          type="text"
                          placeholder="Explain coverage..."
                          value={benefitDetails["individualHealth"] || ""}
                          onChange={(e) => updateBenefitDetail("individualHealth", e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        />
                      )}
                    </div>

                    {/* Family Health Insurance */}
                    <div className="space-y-2">
                      <label className="inline-flex items-start">
                        <input
                          type="checkbox"
                          checked={benefits["familyHealth"] || false}
                          onChange={() => toggleBenefit("familyHealth")}
                          className="h-4 w-4 mt-1 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="ml-2 text-sm text-gray-700">Family Health Insurance</span>
                      </label>
                      {benefits["familyHealth"] && (
                        <input
                          type="text"
                          placeholder="Explain coverage..."
                          value={benefitDetails["familyHealth"] || ""}
                          onChange={(e) => updateBenefitDetail("familyHealth", e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        />
                      )}
                    </div>

                    {/* Dental Insurance */}
                    <div className="space-y-2">
                      <label className="inline-flex items-start">
                        <input
                          type="checkbox"
                          checked={benefits["dental"] || false}
                          onChange={() => toggleBenefit("dental")}
                          className="h-4 w-4 mt-1 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="ml-2 text-sm text-gray-700">Dental Insurance</span>
                      </label>
                      {benefits["dental"] && (
                        <input
                          type="text"
                          placeholder="Explain coverage..."
                          value={benefitDetails["dental"] || ""}
                          onChange={(e) => updateBenefitDetail("dental", e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        />
                      )}
                    </div>

                    {/* Vision Insurance */}
                    <div className="space-y-2">
                      <label className="inline-flex items-start">
                        <input
                          type="checkbox"
                          checked={benefits["vision"] || false}
                          onChange={() => toggleBenefit("vision")}
                          className="h-4 w-4 mt-1 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="ml-2 text-sm text-gray-700">Vision Insurance</span>
                      </label>
                      {benefits["vision"] && (
                        <input
                          type="text"
                          placeholder="Explain coverage..."
                          value={benefitDetails["vision"] || ""}
                          onChange={(e) => updateBenefitDetail("vision", e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        />
                      )}
                    </div>

                    {/* Life Insurance */}
                    <div className="space-y-2">
                      <label className="inline-flex items-start">
                        <input
                          type="checkbox"
                          checked={benefits["lifeInsurance"] || false}
                          onChange={() => toggleBenefit("lifeInsurance")}
                          className="h-4 w-4 mt-1 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="ml-2 text-sm text-gray-700">Life Insurance</span>
                      </label>
                      {benefits["lifeInsurance"] && (
                        <input
                          type="text"
                          placeholder="Coverage amount, policy details..."
                          value={benefitDetails["lifeInsurance"] || ""}
                          onChange={(e) => updateBenefitDetail("lifeInsurance", e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        />
                      )}
                    </div>

                    {/* Disability Insurance */}
                    <div className="space-y-2">
                      <label className="inline-flex items-start">
                        <input
                          type="checkbox"
                          checked={benefits["disability"] || false}
                          onChange={() => toggleBenefit("disability")}
                          className="h-4 w-4 mt-1 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="ml-2 text-sm text-gray-700">Disability Insurance</span>
                      </label>
                      {benefits["disability"] && (
                        <input
                          type="text"
                          placeholder="Short-term? Long-term?"
                          value={benefitDetails["disability"] || ""}
                          onChange={(e) => updateBenefitDetail("disability", e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        />
                      )}
                    </div>

                    {/* Paid Time Off (PTO) */}
                    <div className="space-y-2">
                      <label className="inline-flex items-start">
                        <input
                          type="checkbox"
                          checked={benefits["pto"] || false}
                          onChange={() => toggleBenefit("pto")}
                          className="h-4 w-4 mt-1 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="ml-2 text-sm text-gray-700">Paid Time Off (PTO)</span>
                      </label>
                      {benefits["pto"] && (
                        <input
                          type="text"
                          placeholder="Vacation days, personal days, etc."
                          value={benefitDetails["pto"] || ""}
                          onChange={(e) => updateBenefitDetail("pto", e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        />
                      )}
                    </div>

                    {/* Relocation Assistance */}
                    <div className="space-y-2">
                      <label className="inline-flex items-start">
                        <input
                          type="checkbox"
                          checked={benefits["relocation"] || false}
                          onChange={() => toggleBenefit("relocation")}
                          className="h-4 w-4 mt-1 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="ml-2 text-sm text-gray-700">Relocation Assistance</span>
                      </label>
                      {benefits["relocation"] && (
                        <input
                          type="text"
                          placeholder="Moving costs covered? Housing?"
                          value={benefitDetails["relocation"] || ""}
                          onChange={(e) => updateBenefitDetail("relocation", e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        />
                      )}
                    </div>

                    {/* Investment Opportunities */}
                    <div className="space-y-2">
                      <label className="inline-flex items-start">
                        <input
                          type="checkbox"
                          checked={benefits["investment"] || false}
                          onChange={() => toggleBenefit("investment")}
                          className="h-4 w-4 mt-1 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="ml-2 text-sm text-gray-700">Investment Opportunities</span>
                      </label>
                      {benefits["investment"] && (
                        <input
                          type="text"
                          placeholder="e.g., 401(k), stock options, ESPP..."
                          value={benefitDetails["investment"] || ""}
                          onChange={(e) => updateBenefitDetail("investment", e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        />
                      )}
                    </div>

                    {/* Sick Leave */}
                    <div className="space-y-2">
                      <label className="inline-flex items-start">
                        <input
                          type="checkbox"
                          checked={benefits["sickLeave"] || false}
                          onChange={() => toggleBenefit("sickLeave")}
                          className="h-4 w-4 mt-1 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="ml-2 text-sm text-gray-700">Sick Leave</span>
                      </label>
                      {benefits["sickLeave"] && (
                        <input
                          type="text"
                          placeholder="Number of days or policy details..."
                          value={benefitDetails["sickLeave"] || ""}
                          onChange={(e) => updateBenefitDetail("sickLeave", e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        />
                      )}
                    </div>

                    {/* Paid Holidays */}
                    <div className="space-y-2">
                      <label className="inline-flex items-start">
                        <input
                          type="checkbox"
                          checked={benefits["paidHolidays"] || false}
                          onChange={() => toggleBenefit("paidHolidays")}
                          className="h-4 w-4 mt-1 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="ml-2 text-sm text-gray-700">Paid Holidays</span>
                      </label>
                      {benefits["paidHolidays"] && (
                        <input
                          type="text"
                          placeholder="Which holidays are covered?"
                          value={benefitDetails["paidHolidays"] || ""}
                          onChange={(e) => updateBenefitDetail("paidHolidays", e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        />
                      )}
                    </div>

                    {/* Retirement Savings Plans */}
                    <div className="space-y-2">
                      <label className="inline-flex items-start">
                        <input
                          type="checkbox"
                          checked={benefits["retirement"] || false}
                          onChange={() => toggleBenefit("retirement")}
                          className="h-4 w-4 mt-1 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="ml-2 text-sm text-gray-700">Retirement Savings Plans</span>
                      </label>
                      {benefits["retirement"] && (
                        <input
                          type="text"
                          placeholder="401(k), 403(b), employer match, pension?"
                          value={benefitDetails["retirement"] || ""}
                          onChange={(e) => updateBenefitDetail("retirement", e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        />
                      )}
                    </div>

                    {/* Flexible Spending / Health Savings Accounts */}
                    <div className="space-y-2">
                      <label className="inline-flex items-start">
                        <input
                          type="checkbox"
                          checked={benefits["fsaHsa"] || false}
                          onChange={() => toggleBenefit("fsaHsa")}
                          className="h-4 w-4 mt-1 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="ml-2 text-sm text-gray-700">Flexible Spending / Health Savings Accounts</span>
                      </label>
                      {benefits["fsaHsa"] && (
                        <input
                          type="text"
                          placeholder="Contribution limits, employer contributions?"
                          value={benefitDetails["fsaHsa"] || ""}
                          onChange={(e) => updateBenefitDetail("fsaHsa", e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        />
                      )}
                    </div>

                    {/* Parental Leave */}
                    <div className="space-y-2">
                      <label className="inline-flex items-start">
                        <input
                          type="checkbox"
                          checked={benefits["parentalLeave"] || false}
                          onChange={() => toggleBenefit("parentalLeave")}
                          className="h-4 w-4 mt-1 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="ml-2 text-sm text-gray-700">Parental Leave</span>
                      </label>
                      {benefits["parentalLeave"] && (
                        <input
                          type="text"
                          placeholder="Maternity, paternity, adoption, etc."
                          value={benefitDetails["parentalLeave"] || ""}
                          onChange={(e) => updateBenefitDetail("parentalLeave", e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        />
                      )}
                    </div>

                    {/* Tuition Reimbursement / Education Assistance */}
                    <div className="space-y-2">
                      <label className="inline-flex items-start">
                        <input
                          type="checkbox"
                          checked={benefits["tuition"] || false}
                          onChange={() => toggleBenefit("tuition")}
                          className="h-4 w-4 mt-1 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="ml-2 text-sm text-gray-700">Tuition Reimbursement / Education Assistance</span>
                      </label>
                      {benefits["tuition"] && (
                        <input
                          type="text"
                          placeholder="Annual limits, eligibility..."
                          value={benefitDetails["tuition"] || ""}
                          onChange={(e) => updateBenefitDetail("tuition", e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        />
                      )}
                    </div>

                    {/* Employee Assistance Programs (EAPs) */}
                    <div className="space-y-2">
                      <label className="inline-flex items-start">
                        <input
                          type="checkbox"
                          checked={benefits["eap"] || false}
                          onChange={() => toggleBenefit("eap")}
                          className="h-4 w-4 mt-1 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="ml-2 text-sm text-gray-700">Employee Assistance Programs (EAPs)</span>
                      </label>
                      {benefits["eap"] && (
                        <input
                          type="text"
                          placeholder="Counseling, financial/legal aid details..."
                          value={benefitDetails["eap"] || ""}
                          onChange={(e) => updateBenefitDetail("eap", e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        />
                      )}
                    </div>

                    {/* Wellness Programs */}
                    <div className="space-y-2">
                      <label className="inline-flex items-start">
                        <input
                          type="checkbox"
                          checked={benefits["wellness"] || false}
                          onChange={() => toggleBenefit("wellness")}
                          className="h-4 w-4 mt-1 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="ml-2 text-sm text-gray-700">Wellness Programs</span>
                      </label>
                      {benefits["wellness"] && (
                        <input
                          type="text"
                          placeholder="Gym reimbursement, health screenings..."
                          value={benefitDetails["wellness"] || ""}
                          onChange={(e) => updateBenefitDetail("wellness", e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        />
                      )}
                    </div>

                    {/* Remote Work / Flexible Scheduling */}
                    <div className="space-y-2">
                      <label className="inline-flex items-start">
                        <input
                          type="checkbox"
                          checked={benefits["remoteFlexible"] || false}
                          onChange={() => toggleBenefit("remoteFlexible")}
                          className="h-4 w-4 mt-1 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="ml-2 text-sm text-gray-700">Remote Work / Flexible Scheduling</span>
                      </label>
                      {benefits["remoteFlexible"] && (
                        <input
                          type="text"
                          placeholder="Work-from-home policies, flexible hours..."
                          value={benefitDetails["remoteFlexible"] || ""}
                          onChange={(e) => updateBenefitDetail("remoteFlexible", e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        />
                      )}
                    </div>

                    {/* Commuter Benefits */}
                    <div className="space-y-2">
                      <label className="inline-flex items-start">
                        <input
                          type="checkbox"
                          checked={benefits["commuter"] || false}
                          onChange={() => toggleBenefit("commuter")}
                          className="h-4 w-4 mt-1 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="ml-2 text-sm text-gray-700">Commuter Benefits</span>
                      </label>
                      {benefits["commuter"] && (
                        <input
                          type="text"
                          placeholder="Transit passes, parking stipends..."
                          value={benefitDetails["commuter"] || ""}
                          onChange={(e) => updateBenefitDetail("commuter", e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        />
                      )}
                    </div>

                    {/* Company Perks & Discounts */}
                    <div className="space-y-2">
                      <label className="inline-flex items-start">
                        <input
                          type="checkbox"
                          checked={benefits["companyPerks"] || false}
                          onChange={() => toggleBenefit("companyPerks")}
                          className="h-4 w-4 mt-1 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="ml-2 text-sm text-gray-700">Company Perks & Discounts</span>
                      </label>
                      {benefits["companyPerks"] && (
                        <input
                          type="text"
                          placeholder="Product discounts, free meals, etc."
                          value={benefitDetails["companyPerks"] || ""}
                          onChange={(e) => updateBenefitDetail("companyPerks", e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        />
                      )}
                    </div>

                    {/* Other */}
                    <div className="space-y-2">
                      <label className="inline-flex items-start">
                        <input
                          type="checkbox"
                          checked={benefits["other"] || false}
                          onChange={() => toggleBenefit("other")}
                          className="h-4 w-4 mt-1 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="ml-2 text-sm text-gray-700">Other</span>
                      </label>
                      {benefits["other"] && (
                        <input
                          type="text"
                          placeholder="Other benefits..."
                          value={benefitDetails["other"] || ""}
                          onChange={(e) => updateBenefitDetail("other", e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email:
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    value={formValues.contactEmail}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Name:
                  </label>
                  <input
                    type="text"
                    id="contactName"
                    value={formValues.contactName}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  />
                </div>

                <div className="flex justify-end pt-4 space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(true)}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors flex items-center"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview Job Listing
                  </button>
                  {/* Remove the save button */}
                </div>
              </form>
            </div>
          </div>

          {/* At the bottom of the form, add debug toggle button */}
          {process.env.NODE_ENV !== "production" && (
            <div className="mt-6 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowDebugInfo(!showDebugInfo)} className="text-xs">
                {showDebugInfo ? "Hide Debug Info" : "Show Debug Info"}
              </Button>
            </div>
          )}

          {/* Debug information section */}
          {process.env.NODE_ENV !== "production" && showDebugInfo && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs">
              <h3 className="font-medium mb-2">Debug Information</h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Business ID:</span> {businessId}
                </div>
                {savedJobId && (
                  <div>
                    <span className="font-medium">Last Saved Job ID:</span> {savedJobId}
                  </div>
                )}
                <div>
                  <span className="font-medium">Job Redis Key:</span> job:{businessId}:{savedJobId || "jobId"}
                </div>
                <div>
                  <span className="font-medium">Jobs Index Key:</span> jobs:{businessId}
                </div>
                <div className="mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.open(`/api/debug/business-jobs?businessId=${businessId}`, "_blank")
                      }
                    }}
                  >
                    View Jobs in Redis
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-6">Select Job Categories</h2>

              <div className="mb-6">
                <p className="text-gray-700 mb-2">Select the categories where your job listing should appear:</p>
                <p className="text-sm text-gray-500 mb-4">
                  You can select multiple categories that apply to your position.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {jobCategories.map((category, index) => (
                    <div
                      key={index}
                      onClick={() => toggleCategorySelection(category.title)}
                      className={`relative p-4 rounded-lg cursor-pointer transition-all ${category.color} hover:shadow-md ${
                        selectedCategories.includes(category.title)
                          ? "ring-2 ring-primary shadow-md"
                          : "border border-gray-200"
                      }`}
                    >
                      {selectedCategories.includes(category.title) && (
                        <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                          <Check size={14} />
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{category.icon}</div>
                        <div>
                          <h3 className="font-medium">{category.title}</h3>
                          <p className="text-xs text-gray-600 line-clamp-2">{category.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h2 className="text-xl font-semibold mb-4">Selected Categories ({selectedCategories.length})</h2>
                {selectedCategories.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {selectedCategories.map((category, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 bg-white rounded border border-gray-200 flex items-center gap-2"
                      >
                        <span>{category}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleCategorySelection(category)
                          }}
                          className="text-gray-400 hover:text-red-500"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic mb-6">No categories selected yet</p>
                )}
                <div className="flex justify-center">
                  <Button
                    type="button"
                    disabled={selectedCategories.length === 0 || isSaving}
                    className={`px-6 py-3 ${selectedCategories.length === 0 ? "opacity-50" : ""}`}
                    onClick={handleSaveJobListing}
                  >
                    {isSaving ? "Saving..." : "Save and Add to Ad-Box"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Job Listing Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Job Listing Preview</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Company Header with Logo */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b border-gray-200">
                <div className="flex items-center">
                  {logoPreview ? (
                    <div className="mr-6 flex-shrink-0">
                      <div className="relative h-20 w-20">
                        <img
                          src={logoPreview || "/placeholder.svg"}
                          alt="Company logo"
                          className="h-full w-full object-contain"
                        />
                      </div>
                    </div>
                  ) : null}
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">{formValues.businessName}</h1>
                    <p className="text-gray-600">{formValues.businessAddress}</p>
                  </div>
                </div>
              </div>

              {/* Job Details */}
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-primary mb-2">{formValues.jobTitle}</h2>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {payType === "hourly" && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        Hourly Pay
                      </span>
                    )}
                    {payType === "salary" && (
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        Salary
                      </span>
                    )}
                    {payType === "other" && (
                      <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        Other Pay Type
                      </span>
                    )}
                    <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {formValues.workHours}
                    </span>
                  </div>

                  {/* Add payment information section */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Compensation</h3>
                    {payType === "hourly" && paymentValues.hourlyMin && (
                      <p className="text-gray-700">
                        <span className="font-medium">Hourly Rate:</span> ${paymentValues.hourlyMin}
                        {paymentValues.hourlyMax && ` - $${paymentValues.hourlyMax}`} per hour
                      </p>
                    )}
                    {payType === "salary" && paymentValues.salaryMin && (
                      <p className="text-gray-700">
                        <span className="font-medium">Salary Range:</span> ${paymentValues.salaryMin}
                        {paymentValues.salaryMax && ` - $${paymentValues.salaryMax}`} per year
                      </p>
                    )}
                    {payType === "other" && paymentValues.otherPay && (
                      <p className="text-gray-700">
                        <span className="font-medium">Compensation:</span> {paymentValues.otherPay}
                      </p>
                    )}
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Job Description</h3>
                    <p className="text-gray-700 whitespace-pre-line">{formValues.jobDescription}</p>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Qualifications</h3>
                    <p className="text-gray-700 whitespace-pre-line">{formValues.qualifications}</p>
                  </div>

                  {/* Benefits Section */}
                  {Object.keys(benefits).some((key) => benefits[key]) && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Benefits</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {Object.keys(benefits).map((benefit) =>
                          benefits[benefit] ? (
                            <li key={benefit} className="text-gray-700">
                              {benefit.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                              {benefitDetails[benefit] ? `: ${benefitDetails[benefit]}` : ""}
                            </li>
                          ) : null,
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">About {formValues.businessName}</h3>
                    <p className="text-gray-700">{formValues.businessDescription}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Contact Information</h3>
                    <p className="text-gray-700">{formValues.contactName}</p>
                    <p className="text-gray-700">{formValues.contactEmail}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmationOpen} onOpenChange={setIsConfirmationOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-5 rounded-full bg-green-100 p-3">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl font-semibold mb-2">Your Job Listing has been added</DialogTitle>
            <p className="text-gray-600 mb-6">
              Your job listing has been successfully saved and added to your business profile.
            </p>

            {/* Add additional information to the success dialog */}
            <div className="bg-blue-50 p-4 rounded-lg text-sm mb-6 text-left w-full">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-700 mb-1">Where to find your job listing:</p>
                  <ul className="list-disc pl-5 text-blue-600 space-y-1">
                    <li>In your business profile pop-up under "Job Opportunities"</li>
                    <li>On your Statistics page under "Your Job Listings"</li>
                  </ul>
                  <p className="text-blue-600 mt-2">
                    Business ID: <strong>{businessId}</strong>
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={() => setIsConfirmationOpen(false)} className="min-w-[100px]">
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Business ID Dialog */}
      <Dialog open={isBusinessIdDialogOpen} onOpenChange={setIsBusinessIdDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Business ID</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              Enter the business ID that will be used for your job listings. This ID is used to connect jobs to
              businesses.
            </p>
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <label htmlFor="businessId" className="text-sm font-medium">
                  Business ID
                </label>
                <input
                  id="businessId"
                  value={businessId}
                  onChange={(e) => setBusinessId(e.target.value)}
                  className="border rounded-md p-2"
                />
              </div>

              {/* Quick select buttons */}
              <div className="flex flex-wrap gap-2">
                <p className="text-sm font-medium w-full">Quick select:</p>
                <Button size="sm" variant="outline" onClick={() => setBusinessId("demo-business")}>
                  demo-business
                </Button>
                <Button size="sm" variant="outline" onClick={() => setBusinessId("memorial-gardens")}>
                  memorial-gardens
                </Button>
                <Button size="sm" variant="outline" onClick={() => setBusinessId("sunset-funeral-home")}>
                  sunset-funeral-home
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveBusinessId}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MainFooter />
    </div>
  )
}

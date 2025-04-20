"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMobile } from "@/hooks/use-mobile"
import { LegalNotice } from "./legal-notice"
import { PrivacyPolicy } from "./privacy-policy"

export function LegalAgreement() {
  const router = useRouter()
  const isMobile = useMobile()
  const [activeTab, setActiveTab] = useState("legal")
  const [legalAgreed, setLegalAgreed] = useState(false)
  const [privacyAgreed, setPrivacyAgreed] = useState(false)

  // Automatically switch to privacy tab when legal is agreed to
  useEffect(() => {
    if (legalAgreed) {
      // Add a small delay for better UX - makes the checkbox change visible before tab switch
      const timer = setTimeout(() => {
        setActiveTab("privacy")
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [legalAgreed])

  const handleContinue = () => {
    if (legalAgreed && privacyAgreed) {
      router.push("/workbench") // Changed from /business-portal to /workbench
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  const handleLegalAgreement = (checked: boolean) => {
    setLegalAgreed(checked)
    // Tab switch is handled by the useEffect
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-center mb-6">Legal Agreements</h1>

      {isMobile && (
        <div className="flex justify-between mb-4">
          <div
            className={`flex-1 text-center pb-2 ${
              activeTab === "legal" ? "border-b-2 border-red-600 font-medium" : ""
            }`}
          >
            Step 1: Legal Notice
          </div>
          <div
            className={`flex-1 text-center pb-2 ${
              activeTab === "privacy" ? "border-b-2 border-red-600 font-medium" : ""
            }`}
          >
            Step 2: Privacy Policy
          </div>
        </div>
      )}

      <Tabs defaultValue="legal" value={activeTab} onValueChange={handleTabChange} className="w-full">
        {!isMobile && (
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger
              value="legal"
              className={
                activeTab === "legal"
                  ? "bg-red-600 text-white data-[state=active]:bg-red-600 data-[state=active]:text-white"
                  : ""
              }
            >
              Legal Notice
            </TabsTrigger>
            <TabsTrigger
              value="privacy"
              className={
                activeTab === "privacy"
                  ? "bg-red-600 text-white data-[state=active]:bg-red-600 data-[state=active]:text-white"
                  : ""
              }
            >
              Privacy Policy
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="legal" className="mt-0">
          <div className="bg-gray-50 p-4 rounded-md max-h-[400px] overflow-y-auto mb-4">
            <LegalNotice />
          </div>

          <div className="flex items-start space-x-2 mb-6">
            <Checkbox
              id="legal-agreement"
              checked={legalAgreed}
              onCheckedChange={(checked) => handleLegalAgreement(checked === true)}
            />
            <label
              htmlFor="legal-agreement"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I have read and agree to the Legal Notice
            </label>
          </div>

          {isMobile && (
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => router.push("/")}>
                Cancel
              </Button>
              <Button
                onClick={() => setActiveTab("privacy")}
                disabled={!legalAgreed}
                className={legalAgreed ? "bg-red-600 hover:bg-red-700" : ""}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="privacy" className="mt-0">
          <div className="bg-gray-50 p-4 rounded-md max-h-[400px] overflow-y-auto mb-4">
            <PrivacyPolicy />
          </div>

          <div className="flex items-start space-x-2 mb-6">
            <Checkbox
              id="privacy-agreement"
              checked={privacyAgreed}
              onCheckedChange={(checked) => setPrivacyAgreed(checked === true)}
            />
            <label
              htmlFor="privacy-agreement"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I have read and agree to the Privacy Policy
            </label>
          </div>

          {isMobile && (
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("legal")}>
                Back
              </Button>
              <Button
                onClick={handleContinue}
                disabled={!privacyAgreed}
                className={privacyAgreed ? "bg-red-600 hover:bg-red-700" : ""}
              >
                Continue
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {!isMobile && (
        <div className="flex justify-end space-x-4 mt-6">
          <Button variant="outline" onClick={() => router.push("/")}>
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!legalAgreed || !privacyAgreed}
            className={legalAgreed && privacyAgreed ? "bg-red-600 hover:bg-red-700" : ""}
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  )
}

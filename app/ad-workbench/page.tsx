"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdWorkbenchPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the ad-design page
    router.push("/ad-design")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting to Ad Design...</h1>
        <p className="text-gray-600">Please wait while we redirect you to the new Ad Design page.</p>
      </div>
    </div>
  )
}

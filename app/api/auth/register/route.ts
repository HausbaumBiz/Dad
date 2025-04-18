import { type NextRequest, NextResponse } from "next/server"
import { createUser } from "@/lib/user"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const zipCode = formData.get("zipCode") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    // Validate form data
    if (!firstName || !lastName || !zipCode || !email || !password || !confirmPassword) {
      return NextResponse.json({ success: false, message: "All fields are required" }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ success: false, message: "Passwords do not match" }, { status: 400 })
    }

    // Create user in database
    const result = await createUser({
      firstName,
      lastName,
      email,
      zipCode,
      password,
    })

    if (result.success && result.userId) {
      // Set a registration success cookie for the toast
      cookies().set("registrationSuccess", "true", {
        maxAge: 60, // 1 minute
        path: "/",
      })

      return NextResponse.json({
        success: true,
        message: "User registered successfully",
      })
    }

    return NextResponse.json({ success: false, message: result.message || "Registration failed" }, { status: 400 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ success: false, message: "An error occurred during registration" }, { status: 500 })
  }
}

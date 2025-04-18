import { type NextRequest, NextResponse } from "next/server"
import { verifyCredentials } from "@/lib/user"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    // Validate form data
    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required" }, { status: 400 })
    }

    // Verify credentials
    const result = await verifyCredentials(email, password)

    if (result.success && result.userId) {
      // Set a session cookie
      cookies().set("userId", result.userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
        sameSite: "lax",
      })

      // Return userId in the response for localStorage backup
      return NextResponse.json({
        success: true,
        message: "Login successful",
        userId: result.userId,
      })
    }

    return NextResponse.json({ success: false, message: "Invalid email or password" }, { status: 401 })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, message: "An error occurred during login" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { getUserById } from "@/lib/user"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    // Verify the user exists
    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Set a session cookie
    cookies().set("userId", userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
      sameSite: "lax",
    })

    return NextResponse.json({ success: true, message: "Session restored successfully" })
  } catch (error) {
    console.error("Session restoration error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred during session restoration" },
      { status: 500 },
    )
  }
}

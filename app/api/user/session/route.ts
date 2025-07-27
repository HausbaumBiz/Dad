import { type NextRequest, NextResponse } from "next/server"
import { getUserSession } from "@/app/actions/user-actions"

export async function GET(request: NextRequest) {
  try {
    console.log("[Session API] Getting user session")

    const session = await getUserSession()

    if (session.user) {
      console.log("[Session API] User session found:", session.user.firstName, session.user.lastName)
      return NextResponse.json({
        success: true,
        user: session.user,
      })
    } else {
      console.log("[Session API] No user session found")
      return NextResponse.json({
        success: false,
        user: null,
      })
    }
  } catch (error) {
    console.error("[Session API] Error:", error)
    return NextResponse.json(
      {
        success: false,
        user: null,
        error: "Failed to get user session",
      },
      { status: 500 },
    )
  }
}

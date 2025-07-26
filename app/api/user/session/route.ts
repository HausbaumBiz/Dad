import { type NextRequest, NextResponse } from "next/server"
import { getUserSession } from "@/app/actions/user-actions"

export async function GET(request: NextRequest) {
  try {
    const user = await getUserSession()

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error) {
    console.error("Error getting user session:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get user session",
        user: null,
      },
      { status: 500 },
    )
  }
}

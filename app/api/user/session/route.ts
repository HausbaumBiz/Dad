import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserById } from "@/lib/user"

export async function GET(request: NextRequest) {
  // Get the userId from the cookie
  const cookieStore = cookies()
  const userId = cookieStore.get("userId")?.value

  if (!userId) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  try {
    const user = await getUserById(userId)

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 404 })
    }

    // Remove sensitive information
    const { passwordHash, ...safeUser } = user

    return NextResponse.json({
      authenticated: true,
      ...safeUser,
    })
  } catch (error) {
    console.error("Error fetching user session:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

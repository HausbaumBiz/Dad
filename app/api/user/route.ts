import { type NextRequest, NextResponse } from "next/server"
import { getUserById } from "@/lib/user"

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("id")

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 })
  }

  try {
    const user = await getUserById(userId)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Remove sensitive information
    const { passwordHash, ...safeUser } = user

    return NextResponse.json(safeUser)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

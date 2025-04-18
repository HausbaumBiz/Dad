import { type NextRequest, NextResponse } from "next/server"
import { updateUser } from "@/lib/user"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const userId = formData.get("userId") as string
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const zipCode = formData.get("zipCode") as string

    // Validate form data
    if (!userId || !firstName || !lastName || !zipCode) {
      return NextResponse.json({ success: false, message: "All fields are required" }, { status: 400 })
    }

    // Update user in database
    const result = await updateUser(userId, {
      firstName,
      lastName,
      zipCode,
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "User updated successfully",
      })
    }

    return NextResponse.json({ success: false, message: result.message || "Update failed" }, { status: 400 })
  } catch (error) {
    console.error("User update error:", error)
    return NextResponse.json({ success: false, message: "An error occurred during update" }, { status: 500 })
  }
}

import { migrateUsersToSet } from "@/lib/user"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const result = await migrateUsersToSet()

    if (result.success) {
      return NextResponse.json({
        success: true,
        count: result.count,
        message: `Successfully migrated ${result.count} users`,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in migration API route:", error)
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 },
    )
  }
}

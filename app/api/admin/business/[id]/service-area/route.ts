import { NextResponse } from "next/server"
import { getBusinessZipCodesById } from "@/app/actions/zip-code-actions"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    if (!id) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 })
    }

    // Use our improved function to get ZIP codes
    const result = await getBusinessZipCodesById(id)

    if (!result.success) {
      return NextResponse.json({ error: result.message || "Failed to retrieve service area" }, { status: 500 })
    }

    // Return the data in the expected format
    return NextResponse.json({
      isNationwide: result.data?.isNationwide || false,
      zipCodes: result.data?.zipCodes.map((z) => z.zip) || [],
      // Include the full ZIP code data for additional information
      zipCodeDetails: result.data?.zipCodes || [],
    })
  } catch (error) {
    console.error(`Error getting zip codes for business ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to retrieve service area" }, { status: 500 })
  }
}

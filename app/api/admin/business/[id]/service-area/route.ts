import { type NextRequest, NextResponse } from "next/server"
import { getBusinessZipCodesById } from "@/app/actions/zip-code-actions"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const businessId = params.id

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 })
    }

    console.log(`Getting service area for business: ${businessId}`)

    // Get the business's ZIP codes and nationwide flag from the zip-code-actions
    const result = await getBusinessZipCodesById(businessId)

    if (!result.success) {
      console.error(`Failed to get ZIP codes for business ${businessId}:`, result.message)
      return NextResponse.json({ error: result.message || "Failed to get service area" }, { status: 500 })
    }

    const { zipCodes, isNationwide } = result.data || { zipCodes: [], isNationwide: false }

    console.log(`Business ${businessId} service area:`, {
      zipCodes: zipCodes.length,
      isNationwide,
      sampleZips: zipCodes.slice(0, 5).map((z) => z.zip),
    })

    // Return the service area data in the format the frontend expects
    return NextResponse.json({
      zipCodes: zipCodes, // This includes all ZIP codes from radius selector
      isNationwide: isNationwide,
      businessId: businessId,
    })
  } catch (error) {
    console.error(`Error getting service area for business ${params.id}:`, error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

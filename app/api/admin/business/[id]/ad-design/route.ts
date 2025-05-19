import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 })
    }

    // Define the keys we'll be using
    const mainKey = `${KEY_PREFIXES.BUSINESS}${id}:adDesign`
    const colorsKey = `${KEY_PREFIXES.BUSINESS}${id}:adDesign:colors`
    const businessInfoKey = `${KEY_PREFIXES.BUSINESS}${id}:adDesign:businessInfo`
    const hiddenFieldsKey = `${KEY_PREFIXES.BUSINESS}${id}:adDesign:hiddenFields`

    // Get the main ad design data
    let adDesignData = null
    try {
      const designDataStr = await kv.get(mainKey)
      adDesignData = designDataStr
        ? typeof designDataStr === "string"
          ? JSON.parse(designDataStr)
          : designDataStr
        : null
    } catch (error) {
      console.error("Error getting ad design data:", error)
    }

    // Get additional data
    let colorValues = {}
    let businessInfo = {}
    let hiddenFields = {}

    try {
      const colorValuesStr = await kv.get(colorsKey)
      colorValues = colorValuesStr
        ? typeof colorValuesStr === "string"
          ? JSON.parse(colorValuesStr)
          : colorValuesStr
        : {}
    } catch (error) {
      console.error("Error getting color values:", error)
    }

    try {
      const businessInfoStr = await kv.get(businessInfoKey)
      businessInfo = businessInfoStr
        ? typeof businessInfoStr === "string"
          ? JSON.parse(businessInfoStr)
          : businessInfoStr
        : {}
    } catch (error) {
      console.error("Error getting business info:", error)
    }

    try {
      const hiddenFieldsStr = await kv.get(hiddenFieldsKey)
      hiddenFields = hiddenFieldsStr
        ? typeof hiddenFieldsStr === "string"
          ? JSON.parse(hiddenFieldsStr)
          : hiddenFieldsStr
        : {}
    } catch (error) {
      console.error("Error getting hidden fields:", error)
    }

    if (!adDesignData) {
      return NextResponse.json(null)
    }

    // Combine all data
    const combinedData = {
      ...adDesignData,
      colorValues,
      businessInfo,
      hiddenFields,
    }

    // Make sure we're returning the customButton data that's stored in the main design data
    return NextResponse.json(combinedData)
  } catch (error) {
    console.error("Error fetching business ad design:", error)
    return NextResponse.json({ error: "Failed to fetch business ad design" }, { status: 500 })
  }
}

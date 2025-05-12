import { type NextRequest, NextResponse } from "next/server"
import { uploadToCloudflareImages } from "@/lib/cloudflare-images"
import {
  saveCouponTerms,
  saveCouponMetadata,
  saveCouponImageId,
  saveCouponIds,
  getCouponIds,
  getCouponImageId,
} from "@/app/actions/coupon-image-actions"
import { deleteFromCloudflareImages } from "@/lib/cloudflare-images"

// Update the POST handler to handle coupon IDs more safely and prevent duplicates
export async function POST(request: NextRequest) {
  try {
    const { coupon, businessId, imageBase64 } = await request.json()

    if (!coupon || !businessId || !imageBase64) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Check if this coupon already has an image in Cloudflare
    const existingImageResult = await getCouponImageId(businessId, coupon.id)
    let cloudflareImageId: string | undefined

    if (existingImageResult.success && existingImageResult.imageId) {
      // Image exists - delete the old one first to avoid accumulating unused images
      try {
        await deleteFromCloudflareImages(existingImageResult.imageId)
        console.log(`Deleted existing image ${existingImageResult.imageId} for coupon ${coupon.id}`)
      } catch (deleteError) {
        console.warn(`Warning: Could not delete existing image: ${deleteError}`)
        // Continue with the upload even if deletion fails
      }
    }

    // Extract the base64 data (remove the data:image/png;base64, part)
    const base64Data = imageBase64.split(",")[1]
    const imageBuffer = Buffer.from(base64Data, "base64")

    // Upload the image to Cloudflare
    const metadata = {
      businessId,
      couponId: coupon.id,
      type: "coupon",
      size: coupon.size,
    }

    const filename = `coupon-${businessId}-${coupon.id}.png`

    // Pass the base64 string directly to the upload function
    const uploadResult = await uploadToCloudflareImages(imageBase64, metadata, filename)

    if (!uploadResult || !uploadResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: uploadResult?.error || "Failed to upload image to Cloudflare",
        },
        { status: 500 },
      )
    }

    cloudflareImageId = uploadResult.result.id

    // Save the terms to Redis
    const termsResult = await saveCouponTerms(businessId, coupon.id, coupon.terms)

    if (!termsResult.success) {
      return NextResponse.json({ success: false, error: "Failed to save coupon terms" }, { status: 500 })
    }

    // Save the coupon metadata (without terms)
    const { terms, id, ...metadataWithoutTerms } = coupon
    const metadataResult = await saveCouponMetadata(businessId, coupon.id, metadataWithoutTerms)

    if (!metadataResult.success) {
      return NextResponse.json({ success: false, error: "Failed to save coupon metadata" }, { status: 500 })
    }

    // Save the Cloudflare image ID
    const imageIdResult = await saveCouponImageId(businessId, coupon.id, cloudflareImageId)

    if (!imageIdResult.success) {
      return NextResponse.json({ success: false, error: "Failed to save coupon image ID" }, { status: 500 })
    }

    // Update the list of coupon IDs for this business
    try {
      const couponIdsResult = await getCouponIds(businessId)

      // Ensure we have an array of coupon IDs
      let existingIds: string[] = []
      if (couponIdsResult.success && Array.isArray(couponIdsResult.couponIds)) {
        existingIds = couponIdsResult.couponIds
      }

      // Convert coupon.id to string if it's not already
      const couponIdStr = String(coupon.id)

      // Only add the ID if it's not already in the list
      if (!existingIds.includes(couponIdStr)) {
        const updatedIds = [...existingIds, couponIdStr]
        await saveCouponIds(businessId, updatedIds)
      }
    } catch (idError) {
      console.error("Error updating coupon IDs:", idError)
      // Continue even if this fails, as the coupon is still saved
    }

    return NextResponse.json({
      success: true,
      imageId: cloudflareImageId,
      message: "Coupon saved successfully",
      updated: existingImageResult.success && existingImageResult.imageId ? true : false,
    })
  } catch (error) {
    console.error("Error saving coupon as image:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}

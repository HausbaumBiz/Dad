import { getBusinessById } from "@/app/actions/business-actions"
import { notFound } from "next/navigation"
import BusinessDetailPageClient from "./BusinessDetailPageClient"

interface BusinessDetailPageProps {
  params: {
    id: string
  }
}

export default async function BusinessDetailPage({ params }: BusinessDetailPageProps) {
  const { id } = params
  const business = await getBusinessById(id)

  if (!business) {
    notFound()
  }

  return <BusinessDetailPageClient business={business} />
}

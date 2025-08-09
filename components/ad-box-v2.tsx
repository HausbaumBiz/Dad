import type React from "react"
import type { Business } from "../../types"
import PhotoCarousel from "./PhotoCarousel"
import BusinessInfo from "./BusinessInfo"

interface AdBoxProps {
  business: Business
}

const AdBoxV2: React.FC<AdBoxProps> = ({ business }) => {
  const isPlaceholder = Boolean((business as any)?.isPlaceholder)

  return (
    <div className="ad-box">
      <BusinessInfo business={business} />
      {!isPlaceholder && <PhotoCarousel businessId={business.id} />}
      {/* rest of code here */}
    </div>
  )
}

export default AdBoxV2

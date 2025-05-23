import RemoveDemoBusinessesClient from "./remove-demo-businesses-client"

export const metadata = {
  title: "Remove Demo Businesses - Admin",
  description: "Remove demo businesses from the database",
}

export default async function RemoveDemoBusinessesPage() {
  return (
    <div className="container mx-auto py-6">
      <RemoveDemoBusinessesClient />
    </div>
  )
}

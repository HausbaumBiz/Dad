export const metadata = {
  title: "Admin Dashboard",
  description: "Admin dashboard for managing the application",
}

export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Users</h2>
          <p className="text-gray-600 mb-4">Manage user accounts and permissions.</p>
          <a href="/admin/users" className="text-blue-600 hover:text-blue-800">
            View Users →
          </a>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Businesses</h2>
          <p className="text-gray-600 mb-4">Manage business listings and information.</p>
          <a href="/admin/businesses" className="text-blue-600 hover:text-blue-800">
            View Businesses →
          </a>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">ZIP Codes</h2>
          <p className="text-gray-600 mb-4">Manage ZIP code data and service areas.</p>
          <a href="/admin/zip-codes" className="text-blue-600 hover:text-blue-800">
            View ZIP Codes →
          </a>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Media</h2>
          <p className="text-gray-600 mb-4">Manage uploaded images, videos, and other media.</p>
          <a href="/admin/media" className="text-blue-600 hover:text-blue-800">
            View Media →
          </a>
        </div>
      </div>
    </div>
  )
}

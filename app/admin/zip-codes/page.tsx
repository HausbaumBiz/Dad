import { getZipCodeCount, isZipDatabaseInitialized } from "@/lib/zip-codes"

export default async function ZipCodeAdminPage() {
  const initialized = await isZipDatabaseInitialized()
  const zipCount = await getZipCodeCount()

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">ZIP Code Database Administration</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Database Status</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Database Initialized:</p>
            <p className="font-medium">{initialized ? "Yes" : "No"}</p>
          </div>
          <div>
            <p className="text-gray-600">ZIP Code Count:</p>
            <p className="font-medium">{zipCount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Import ZIP Codes</h2>
        <p className="mb-4">To import ZIP codes, you need to run the import script from the command line:</p>
        <div className="bg-gray-100 p-4 rounded font-mono text-sm mb-4">npm run import-zip-codes</div>
        <p className="text-sm text-gray-600">
          Note: The import process may take several minutes to complete. Make sure you have the ZIP code CSV file in the
          data directory.
        </p>
      </div>
    </div>
  )
}

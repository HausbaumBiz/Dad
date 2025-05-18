import { DialogTroubleshooter } from "@/components/dialog-troubleshooter"

export default function DialogTroubleshooterPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Dialog Troubleshooter</h1>
      <p className="mb-4">This page helps diagnose and fix issues with dialog close buttons.</p>

      <DialogTroubleshooter />

      <div className="mt-8 p-4 border rounded-md bg-gray-50">
        <h2 className="text-xl font-semibold mb-2">How to use this tool</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Click "Open Test Dialog" to see a sample dialog</li>
          <li>Enable "Debug Mode" to visually highlight all close buttons</li>
          <li>Use "Count Close Buttons" to check how many close buttons are present</li>
          <li>If multiple buttons are found, use "Fix Duplicate Buttons" to hide extras</li>
        </ol>

        <h3 className="text-lg font-semibold mt-4 mb-2">Common issues and fixes:</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Multiple close buttons:</strong> Make sure <code>closeButton=&#123;false&#125;</code> is set on
            DialogContent
          </li>
          <li>
            <strong>CSS not working:</strong> Check if the CSS selectors match the actual class names
          </li>
          <li>
            <strong>Z-index issues:</strong> Ensure the close button has a high enough z-index
          </li>
        </ul>
      </div>
    </div>
  )
}

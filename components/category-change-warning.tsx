import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"

interface CategoryChangeWarningProps {
  hasChanges: boolean
  oldCategories: string[]
  newCategories: string[]
}

export function CategoryChangeWarning({ hasChanges, oldCategories, newCategories }: CategoryChangeWarningProps) {
  if (!hasChanges) return null

  const removedCategories = oldCategories.filter((cat) => !newCategories.includes(cat))

  if (removedCategories.length === 0) return null

  return (
    <Alert className="mb-4">
      <Info className="h-4 w-4" />
      <AlertTitle>Category Changes Detected</AlertTitle>
      <AlertDescription>
        <p className="mt-1">
          You are removing your business from the following {removedCategories.length === 1 ? "category" : "categories"}
          :
        </p>
        <ul className="list-disc list-inside mt-2">
          {removedCategories.map((cat, index) => (
            <li key={index}>{cat}</li>
          ))}
        </ul>
        <p className="mt-2">Your business will no longer appear in these category pages after saving.</p>
      </AlertDescription>
    </Alert>
  )
}

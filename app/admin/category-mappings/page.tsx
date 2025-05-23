import CategoryMappingsClient from "./category-mappings-client"

export const metadata = {
  title: "Category Mappings",
  description: "View and manage mappings between business categories and frontend pages",
}

export default function CategoryMappingsPage() {
  return <CategoryMappingsClient />
}

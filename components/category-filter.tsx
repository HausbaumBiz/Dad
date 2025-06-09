"use client"

interface CategoryFilterProps {
  options: Array<{
    id: string
    label: string
    value: string
  }>
  onFilterChange?: (filterId: string, checked: boolean) => void
  selectedFilters?: string[]
}

export function CategoryFilter({ options, onFilterChange, selectedFilters = [] }: CategoryFilterProps) {
  const handleCheckboxChange = (filterId: string, checked: boolean) => {
    console.log(`Filter change: ${filterId} = ${checked}`)
    if (onFilterChange) {
      onFilterChange(filterId, checked)
    }
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3">Filter by Service</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {options.map((option) => (
          <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedFilters.includes(option.id)}
              onChange={(e) => handleCheckboxChange(option.id, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

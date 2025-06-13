import { CategoryLayout } from "@/components/category-layout"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"

export default function HomeImprovementPage() {
  const categories = [
    {
      title: "Lawn, Garden and Snow Removal",
      href: "/home-improvement/lawn-garden",
      subcategories: [
        "Lawn & Landscaping",
        "Lawn Treatment",
        "Landscape Lighting",
        "Tree Service",
        "Snow Removal",
        "And more...",
      ],
    },
    {
      title: "Outside Home Maintenance and Repair",
      href: "/home-improvement/outside-maintenance",
      subcategories: [
        "Roofing",
        "Siding",
        "House Painting",
        "Pressure Washing",
        "Gutter Cleaning/Repair",
        "And more...",
      ],
    },
    {
      title: "Outdoor Structure Assembly/Construction and Fencing",
      href: "/home-improvement/outdoor-structures",
      subcategories: [
        "Deck/Patio/Porch Construction",
        "Fences",
        "Solar Panel Installation",
        "Playground Equipment Installation",
        "And more...",
      ],
    },
    {
      title: "Pool Services",
      href: "/home-improvement/pool-services",
      subcategories: ["Swimming Pool Installers/Builders", "Swimming Pool Maintenance/Cleaning", "Other Pool Services"],
    },
    {
      title: "Asphalt, Concrete, Stone and Gravel",
      href: "/home-improvement/asphalt-concrete",
      subcategories: [
        "Concrete Driveways",
        "Asphalt Driveways",
        "Stone & Gravel",
        "Stamped Concrete",
        "Concrete Repair",
        "And more...",
      ],
    },
    {
      title: "Home Construction and Design",
      href: "/home-improvement/construction-design",
      subcategories: [
        "General Contractors",
        "Architect",
        "Home Remodeling",
        "Demolition",
        "Land Surveyors",
        "And more...",
      ],
    },
    {
      title: "Inside Home Maintenance and Repair",
      href: "/home-improvement/inside-maintenance",
      subcategories: [
        "Electricians",
        "Plumbers",
        "HVAC Services",
        "Appliance Repair",
        "Indoor Painting",
        "And more...",
      ],
    },
    {
      title: "Windows and Doors",
      href: "/home-improvement/windows-doors",
      subcategories: ["Window Replacement", "Door Installation", "Window Tinting", "Locksmith", "And more..."],
    },
    {
      title: "Floor/Carpet Care and Installation",
      href: "/home-improvement/flooring",
      subcategories: [
        "Carpet Installation",
        "Hardwood Floor Installation",
        "Tile Flooring",
        "Carpet Cleaning",
        "And more...",
      ],
    },
    {
      title: "Audio/Visual and Home Security",
      href: "/home-improvement/audio-visual-security",
      subcategories: [
        "Smart Home Setup",
        "Home Security Solutions",
        "Cinema Room Setup",
        "Computer Repair",
        "And more...",
      ],
    },
    {
      title: "Home Hazard Mitigation",
      href: "/home-improvement/hazard-mitigation",
      subcategories: [
        "Lead-Based Paint Abatement",
        "Radon Mitigation",
        "Mold Removal",
        "Asbestos Removal",
        "And more...",
      ],
    },
    {
      title: "Pest Control/Wildlife Removal",
      href: "/home-improvement/pest-control",
      subcategories: ["Rodent/Small Animal Infestations", "Wildlife Removal", "Insect and Bug Control", "And more..."],
    },
    {
      title: "Trash Cleanup and Removal",
      href: "/home-improvement/trash-cleanup",
      subcategories: [
        "Biohazard Cleanup",
        "Dumpster Rental",
        "Trash/Junk Removal",
        "Document Shredding",
        "And more...",
      ],
    },
    {
      title: "Home and Office Cleaning",
      href: "/home-improvement/cleaning",
      subcategories: [
        "House Cleaning",
        "Office Cleaning",
        "Window Cleaning",
        "Deep Carpet and Floor Cleaning",
        "And more...",
      ],
    },
    {
      title: "Fireplaces and Chimneys",
      href: "/home-improvement/fireplaces-chimneys",
      subcategories: [
        "Chimney Sweep",
        "Chimney and Chimney Cap Repair",
        "Gas Fireplace Repair",
        "Firewood Suppliers",
        "And more...",
      ],
    },
    {
      title: "Movers/Moving Trucks",
      href: "/home-improvement/movers",
      subcategories: ["Moving Truck Rental", "Piano Movers", "Movers", "And more..."],
    },
    {
      title: "Handymen",
      href: "/home-improvement/handymen",
      subcategories: ["Odd Jobs and Repairs", "Product Assembly", "Other Handymen"],
    },
  ]

  return (
    <CategoryLayout title="Looking to Hire? Select the Job Type" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/new%20worker22222-4lMlNzr4ov1wCCPRKCIoIvQhyqweb6.png"
            alt="Home Improvement"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified professionals for all your home improvement needs. Browse categories below or use filters to
            narrow your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Read reviews from other customers</li>
              <li>View business videos showcasing work and staff</li>
              <li>Access exclusive coupons directly on each business listing</li>
              <li>Discover job openings from businesses you'd trust to hire yourself</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category, index) => (
          <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
            <Link href={category.href}>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-primary mb-3">{category.title}</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {category.subcategories.map((sub, idx) => (
                    <li key={idx} className="list-disc list-inside">
                      {sub}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </CategoryLayout>
  )
}

"use client"
import Image from "next/image"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"

interface CategorySelectorProps {
  onCategoryChange: (category: string, isChecked: boolean) => void
  searchTerm?: string
}

export function CategorySelector({ onCategoryChange, searchTerm = "" }: CategorySelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])

  // This is a simplified version with just a few categories for demonstration
  const categories = [
    {
      id: "homeLawnLabor",
      title: "Home, Lawn, and Manual Labor",
      image: "/housebuilding.png",
      subcategories: [
        {
          id: "lawn",
          title: "Lawn, Garden and Snow Removal",
          subcategories: [
            "Lawn & Landscaping",
            "Lawn Treatment",
            "Landscape Lighting",
            "Lawn Mower and Lawn Equipment and Snow Removal Equipment Repair",
            "Tree Service",
            "Plant Nurseries",
            "Mulch Delivery",
            "Soil Tilling",
            "Leaf Removal",
            "Hardscaping",
            "Snow Removal",
            "Other Lawn, Garden and Snow Removal",
          ],
        },
        {
          id: "outside",
          title: "Outside Home Maintenance and Repair",
          subcategories: [
            "Roofing",
            "Masonry Stone and Brick",
            "Glass Block",
            "Siding",
            "Deck Cleaning/Refinishing",
            "Garage Doors",
            "House Painting",
            "Pressure Washing",
            "Foundation Repair",
            "Gutter Cleaning/Repair",
            "Septic Tank Service",
            "Well & Water Pump Repair",
            "Other Outside Home Maintenance and Repair",
          ],
        },
        {
          id: "outdoorStructures",
          title: "Outdoor Structure Assembly/Construction and Fencing",
          subcategories: [
            "Deck/Patio/Porch Construction",
            "Patio and Patio Enclosures",
            "Exterior Cooking Areas",
            "Awnings/Canopies",
            "Playground Equipment Installation/Basketball Hoops",
            "Fountains and Waterscaping",
            "Pond Construction",
            "Solar Panel Installation",
            "Power Generator Installation",
            "Driveway Gate Installation",
            "Earthquake Retrofitting",
            "Mailbox Installation/Repair",
            "Fences",
            "Other Outdoor Structure Assembly/Construction and Fencing",
          ],
        },
        {
          id: "poolServices",
          title: "Pool Services",
          subcategories: [
            "Swimming Pool Installers/Builders",
            "Swimming Pool Maintenance/Cleaning",
            "Other Pool Services",
          ],
        },
        {
          id: "asphaltConcrete",
          title: "Asphalt, Concrete, Stone and Gravel",
          subcategories: [
            "Concrete Driveways",
            "Asphalt Driveways",
            "Other Driveways",
            "Stone & Gravel",
            "Stamped Concrete",
            "Concrete Repair",
            "Other Asphalt, Concrete, Stone and Gravel",
          ],
        },
        {
          id: "construction",
          title: "Home Construction and Design",
          subcategories: [
            "General Contractors",
            "Architect",
            "Home Remodeling",
            "Demolition",
            "Excavating/Earth Moving",
            "Land Surveyors",
            "Other Home Construction and Design",
          ],
        },
        {
          id: "insideHome",
          title: "Inside Home Maintenance and Repair",
          subcategories: [
            "Electricians",
            "Plumbers",
            "Heating, Ventilation, and Air Conditioning Services",
            "Appliance Repair and Installation",
            "Indoor Painting",
            "Drywalling and Repair",
            "Marble & Granite",
            "Water Softeners",
            "Water Heaters",
            "Insulation",
            "Air Duct Cleaning",
            "Dryer Duct Cleaning",
            "Central Vacuum Cleaning",
            "Mold Removal",
            "Plaster Work",
            "Water Damage Repair",
            "Basement Waterproofing",
            "Wallpaper Hanging and Removing",
            "Countertop Installation",
            "Ceiling Fan Installation",
            "Bathtub Refinishing",
            "Cabinet Resurfacing",
            "Cabinet Makers",
            "Tile Installation",
            "Other Inside Home Maintenance and Repair",
          ],
        },
        {
          id: "windowsDoors",
          title: "Windows and Doors",
          subcategories: [
            "Window Replacement",
            "Door Installation",
            "Window Security Film",
            "Window Tinting",
            "Window Dressing/Curtains",
            "Blind/Drapery Cleaning",
            "Locksmith",
            "Other Windows and Doors",
          ],
        },
        {
          id: "floorCarpet",
          title: "Floor/Carpet Care and Installation",
          subcategories: [
            "Carpet Installation",
            "Hardwood Floor Installation",
            "Epoxy Flooring",
            "Tile Flooring",
            "Laminate Flooring",
            "Carpet Cleaning",
            "Floor Buffing and Cleaning",
            "Oriental Rug Cleaning",
            "Other Floor/Carpet Care and Installation",
          ],
        },
        {
          id: "audioVisualSecurity",
          title: "Audio/Visual and Home Security",
          subcategories: [
            "Smart Home Setup",
            "Home Security Solutions",
            "Cinema Room Setup",
            "Telecommunication",
            "Cable/Satellite/Antenna Television",
            "Computer Repair",
            "Other Audio/Visual and Home Security",
          ],
        },
        {
          id: "homeHazard",
          title: "Home Hazard Mitigation",
          subcategories: [
            "Lead-Based Paint Abatement",
            "Radon Mitigation",
            "Mold Removal",
            "Asbestos Removal",
            "Smoke/Carbon Monoxide Detector Installation",
            "Fire Extinguisher Maintenance",
            "Other Home Hazard Mitigation",
          ],
        },
        {
          id: "pestControl",
          title: "Pest Control/ Wildlife Removal",
          subcategories: [
            "Rodent/ Small Animal Infestations",
            "Wildlife Removal",
            "Insect and Bug Control",
            "Other Pest Control/ Wildlife Removal",
          ],
        },
        {
          id: "trashCleanup",
          title: "Trash Cleanup and Removal",
          subcategories: [
            "Biohazard Cleanup",
            "Dumpster Rental",
            "Hauling/Old Furniture and Appliance Removal",
            "Document Shredding",
            "Trash/Junk Removal",
            "Other Trash Cleanup and Removal",
          ],
        },
        {
          id: "homeCleaning",
          title: "Home and Office Cleaning",
          subcategories: [
            "House Cleaning",
            "Office Cleaning",
            "Window Cleaning",
            "Deep Carpet and Floor Cleaning",
            "Other Home and Office Cleaning",
          ],
        },
        {
          id: "fireplacesChimneys",
          title: "Fireplaces and Chimneys",
          subcategories: [
            "Chimney Sweep",
            "Chimney and Chimney Cap Repair",
            "Gas Fireplace Repair",
            "Fireplace Services",
            "Firewood Suppliers",
            "Heating Oil Suppliers",
            "Other Fireplaces and Chimneys",
          ],
        },
        {
          id: "movers",
          title: "Movers/Moving Trucks",
          subcategories: ["Moving Truck Rental", "Piano Movers", "Movers", "Other Movers/Moving Trucks"],
        },
        {
          id: "handymen",
          title: "Handymen",
          subcategories: ["Odd Jobs and Repairs", "Product Assembly", "Other Handymen"],
        },
      ],
    },
    {
      id: "retailStores",
      title: "Retail Stores",
      image: "/retail.png",
      subcategories: [
        "Supermarkets/ Grocery Stores",
        "Department Store",
        "Convenience Store",
        "Clothing Boutique",
        "Discount Store",
        "Warehouse Store",
        "Electronics Store",
        "Bookstore",
        "Jewelry Store",
        "Toy Store",
        "Sporting Goods Store",
        "Furniture Store",
        "Pet Store",
        "Shoe Store",
        "Hardware Store",
        "Stationery Store",
        "Auto Parts Store",
        "Health Food Store",
        "Wine Shop/ Alcohol Sales",
        "Antique Shop",
        "Music Store",
        "Lingerie Store",
        "Gift Shop",
        "Butcher Store",
        "Candy Shop",
        "Mobile Phone Store",
        "Optical Store / Eyewear Boutique",
        "Pharmacy",
        "Home Decor Store",
        "Party Supply Store",
        "Garden Center",
        "Maternity Store",
        "Cosmetics Store",
        "Bicycle Shop",
        "Home Appliance Store",
        "Cheese Shop",
        "Craft Store",
        "Thrift Store",
        "Handbags Store",
        "Baby Store",
        "Tobacco Shop",
        "Art Supply Store",
      ],
    },
    {
      id: "travelVacation",
      title: "Travel and Vacation",
      image: "/travel.png",
      subcategories: [
        "Tour and Travel Guides",
        "Travel Agents",
        "Car Rental",
        "Boat Rental",
        "RV Rental",
        "Airpot Pick-up and Drop-off Services",
        "Hotels, Motels, and Resorts",
        "Bed and Breakfast",
        "Air BnB",
        "Camp Grounds and Cabins",
      ],
    },
    {
      id: "tailors",
      title: "Tailors, Dressmakers, and Fabric and Clothes Cleaning and Repair",
      image: "/tailor.png",
      subcategories: [
        "Tailors, Dressmakers, and Custom Sewers",
        "Laundry and Dry-Cleaning",
        "Shoe and Leather Repair",
        "Costume Makers",
        "Upholsterers",
        "Curtains, Drapes and Window Covering Makers",
      ],
    },
    {
      id: "artDesignEntertainment",
      title: "Art, Design and Entertainment",
      image: "/fineArt.png",
      subcategories: [
        "Fine Artists, Including Painters, Sculptors, and Illustrators",
        "Craft Artists",
        "Musicians and Singers",
        "Recording Studios",
        "Art Galleries",
        "Concert Venues",
        "Fashion Designers",
        "Interior Designers",
        "Photographers and Videographers",
        "Floral Designers",
        "Graphic Designers",
        "All Entertainers and Talent",
        "Talent Agent",
        "Modals",
      ],
    },
    {
      id: "physicalRehabilitation",
      title: "Physical Rehabilitation",
      image: "/physicalRehab.png",
      subcategories: [
        "Occupational Therapists",
        "Physical Therapists",
        "Recreational Therapists",
        "Respiratory Therapists",
        "Speech-Language Pathologists",
        "Exercise Physiologists",
        "Massage Therapist",
        "Art Therapists",
        "Music Therapists",
        "Therapists, All Other",
      ],
    },
    {
      id: "financeInsurance",
      title: "Insurance, Finance, Debt and Sales",
      image: "/finance.png",
      subcategories: [
        "Accountants",
        "Insurance",
        "Advertising",
        "Marketing",
        "Financial and Investment Advisers",
        "Debt Consolidators",
        "Cryptocurrency",
      ],
    },
    {
      id: "weddingsEvents",
      title: "Weddings and Special Events",
      image: "/wedding-events.png",
      subcategories: [
        "Event Halls",
        "Tent and Chair Rentals",
        "Wedding Planners",
        "Food Caterers",
        "Bartenders",
        "Live Music Entertainment",
        "DJs",
        "Performers",
        "Tuxedo Rentals",
        "Limousine Services",
        "Tailors and Seamstresses",
        "Wedding Dresses",
        "Wedding Photographers",
        "Florists",
        "Wedding Cakes",
        "Marriage Officiants",
        "Other Weddings and Special Events",
      ],
    },
    {
      id: "petCare",
      title: "Pet Care",
      image: "/pet-care.png",
      subcategories: [
        "Veterinarians",
        "Pet Hospitals",
        "Dog Fencing/Invisiable Fence",
        "Pet Groomers",
        "Pet Trainers",
        "Pet Walkers",
        "Pet Sitters",
        "Pet Boarders",
        "Pet Breeders",
        "Pet Shops",
        "Pet Rescues",
        "Aquariums/Pet Enclosures",
        "Pet Poop Pickup",
        "Other Pet Care",
      ],
    },
    {
      id: "languageTutoring",
      title: "Language Lessons/School Subject Tutoring",
      image: "/tutoring.png",
      subcategories: [
        "Spanish",
        "French",
        "Chinese",
        "American Sign Language",
        "English as a Second Language",
        "Other Language",
        "Math - Elementary",
        "Math - High School",
        "Reading Tutors (Adult and Childeren)",
        "Test Prep",
        "Other Subjects",
      ],
    },
    {
      id: "realestate",
      title: "Home Buying and Selling",
      image: "/realestate002.png",
      subcategories: [
        "Real Estate Agent",
        "Real Estate Appraising",
        "Home Staging",
        "Home Inspection",
        "Home Energy Audit",
        "Other Home Buying and Selling",
      ],
    },
    {
      id: "athletics",
      title: "Athletics, Personal Trainers, Group Fitness Classes and Dance Instruction",
      image: "/baseball001.png",
      subcategories: [
        "Baseball/Softball",
        "Golf",
        "Tennis",
        "Basketball",
        "Football",
        "Soccer",
        "Ice Skating",
        "Gymnastics",
        "Pickleball",
        "Table Tennis",
        "Dance",
        "Personal Trainers",
        "Group Fitness Classes",
        "Other Athletics, Personal Trainers, etc",
        "Coaches, Scouts, Umpires, Referees",
        "Swim Instruction",
      ],
    },
    {
      id: "music",
      title: "Music",
      image: "/music001.png",
      subcategories: [
        "Piano Lessons",
        "Guitar Lessons",
        "Violin Lessons",
        "Cello Lessons",
        "Trumpet Lessons",
        "Other Instrument Lessons",
        "Instrument Repair",
        "Used and New Instruments for Sale",
        "Other Music",
      ],
    },
    {
      id: "homecare",
      title: "Home Care",
      image: "/aid001.png",
      subcategories: [
        "Non-Medical Elder Care",
        "Non-Medical Special Needs Adult Care",
        "Babysitting (18+ Sitters only)",
        "Other Home Care",
        "Childcare Centers",
        "Adult Day Services",
        "Rehab/Nursing/Respite and Memory Care",
      ],
    },
    {
      id: "automotive",
      title: "Automotive/Motorcycle/RV, etc",
      image: "/automech.png",
      subcategories: [
        "General Auto Repair",
        "Engine and Transmission",
        "Body Shop",
        "Tire and Brakes",
        "Mufflers",
        "Oil Change",
        "Windshield Repair",
        "Custom Paint",
        "Detailing Services",
        "Car Wash",
        "Auto Parts",
        "ATV/Motorcycle Repair",
        "Utility Vehicle Repair",
        "RV Maintenance and Repair",
        "Other Automotive/Motorcycle/RV, etc",
        "Automotive Sales",
        "Motor Sport/Utility Vehicle/RV Sales",
      ],
    },
    {
      id: "beauty",
      title: "Hair care, Beauty, Tattoo and Piercing",
      image: "/beauty.png",
      subcategories: [
        "Barbers",
        "Hairdressers, Hairstylists, and Cosmetologists",
        "Manicurists and Pedicurists",
        "Skincare Specialists",
        "Hair Removal",
        "Body Sculpting",
        "Spas",
        "Tanning",
        "Tattoo and Scar Removal Services",
        "Hair Wigs and Weaves",
        "Beauty Products",
        "Miscellaneous Personal Appearance Workers",
      ],
    },
    {
      id: "medical",
      title: "Medical Practitioners - non MD/DO",
      image: "/dentists.png",
      subcategories: [
        "Chiropractors",
        "Dentists",
        "Orthodontists",
        "Optometrists",
        "Podiatrists",
        "Audiologists",
        "Dietitians and Nutritionists",
        "Naturopaths",
        "Herbalists",
        "Acupuncturist",
        "Orthotists and Prosthetists",
        "Midwives and Doulas",
      ],
    },
    {
      id: "counseling",
      title: "Counselors, Psychologists, Addiction Specialists, Team Building",
      image: "/counseling003.png",
      subcategories: [
        "Counselors",
        "Clinical and Counseling Psychologists",
        "Addiction Specialists",
        "Suboxone, Methadone Clinics",
        "Team Building",
        "Industrial-Organizational Psychologists",
        "Motivational Speakers",
      ],
    },
    {
      id: "computers",
      title: "Computers and the Web",
      image: "/computers.png",
      subcategories: [
        "Computer Network Specialists",
        "Database Administrators",
        "Database Architects",
        "Computer Programmers",
        "Software Developers",
        "Website Developers",
        "Computer Security",
        "BlockChain and Crypto",
        "Technology Consultants",
      ],
    },
    {
      id: "restaurant",
      title: "Restaurant, Food and Drink",
      image: "/chef.png",
      subcategories: [
        "Asian",
        "Indian",
        "Middle Eastern",
        "Mexican",
        "Italian",
        "American",
        "Greek",
        "Other Ethnic Foods",
        "Upscale",
        "Casual",
        "Coffee and Tea Shops",
        "Ice Cream, Confectionery and Cakes",
        "Pizzeria",
        "Bars/Pubs/Taverns",
        "Organic/Vegan/Vegetarian/Farm to table",
        "Fast Food",
        "Catering",
        "Buffet",
        "Bakery/Bagels/Donuts",
        "Breakfast",
        "24 hour/Open Late",
        "Carts/Stands/Trucks",
        "Dinner Theater",
        "Sandwich Shops",
        "Drive-Ins",
        "Seafood",
        "Steak House",
        "Sushi",
        "Cafeteria",
      ],
    },
    {
      id: "personalAssistant",
      title: "Assistants",
      image: "/assistant.png",
      subcategories: [
        "Personal Drivers",
        "Personal Assistants",
        "Companions",
        "Personal Secretaries",
        "Personal Shoppers",
      ],
    },
    {
      id: "mortuaryServices",
      title: "Mortuary Services",
      image: "/funeral.png",
      subcategories: ["Funeral Homes", "Cemetaries", "Florists", "Headstones/ Monuments", "Caskets and Urns"],
    },
    {
      id: "lawyers",
      title: "Lawyers",
      image: "/lawyer001.png",
      subcategories: [
        "Family Lawyer",
        "Criminal Defense Lawyer",
        "Personal Injury Lawyer",
        "Corporate Lawyer",
        "Immigration Lawyer",
        "Intellectual Property Lawyer",
        "Estate Planning Lawyer",
        "Bankruptcy Lawyer",
        "Civil Litigation Lawyer",
        "Real Estate Lawyer",
        "Entertainment Lawyer",
        "Tax Lawyer",
        "Employment Lawyer",
        "Social Security Disability Lawyer",
        "Workers' Compensation Lawyer",
      ],
    },
  ]

  // Helper function to flatten nested subcategories for search
  const flattenSubcategories = (category: any) => {
    const result: string[] = []

    if (Array.isArray(category.subcategories)) {
      category.subcategories.forEach((sub: any) => {
        if (typeof sub === "string") {
          result.push(sub)
        } else if (typeof sub === "object" && sub.title && Array.isArray(sub.subcategories)) {
          // It's a nested category
          result.push(sub.title)
          sub.subcategories.forEach((nestedSub: string) => {
            result.push(nestedSub)
          })
        }
      })
    }

    return result
  }

  // Filter categories based on search term
  const filteredCategories = searchTerm
    ? categories.filter((category) => {
        // Check if category title matches
        if (category.title.toLowerCase().includes(searchTerm.toLowerCase())) {
          return true
        }

        // Get all subcategories (including nested ones) and check if any match
        const allSubcategories = flattenSubcategories(category)
        return allSubcategories.some((subcategory) => subcategory.toLowerCase().includes(searchTerm.toLowerCase()))
      })
    : categories

  // Auto-expand categories that match the search term
  useEffect(() => {
    if (searchTerm) {
      // Calculate matching categories directly from the original categories array
      const matchingCategoryIds = categories
        .filter((category) => {
          // Check if category title matches
          if (category.title.toLowerCase().includes(searchTerm.toLowerCase())) {
            return true
          }

          // Get all subcategories (including nested ones) and check if any match
          const allSubcategories = flattenSubcategories(category)
          return allSubcategories.some((subcategory) => subcategory.toLowerCase().includes(searchTerm.toLowerCase()))
        })
        .map((cat) => cat.id)

      setExpandedCategories(matchingCategoryIds)
    } else {
      setExpandedCategories([])
    }
  }, [searchTerm])

  // Render a subcategory (which might be a string or an object with nested subcategories)
  const renderSubcategory = (parentId: string, subcategory: any, index: number) => {
    if (typeof subcategory === "string") {
      // Regular subcategory (string)
      return (
        <div key={index} className="flex items-start gap-2">
          <Checkbox
            id={`${parentId}-${index}`}
            onCheckedChange={(checked) => onCategoryChange(subcategory, checked === true)}
          />
          <Label
            htmlFor={`${parentId}-${index}`}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            {subcategory}
          </Label>
        </div>
      )
    } else if (typeof subcategory === "object" && subcategory.title) {
      // Nested category
      return (
        <div key={index} className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">{subcategory.title}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pl-4">
            {subcategory.subcategories.map((nestedSub: string, nestedIndex: number) => (
              <div key={nestedIndex} className="flex items-start gap-2">
                <Checkbox
                  id={`${parentId}-${subcategory.id}-${nestedIndex}`}
                  onCheckedChange={(checked) => onCategoryChange(nestedSub, checked === true)}
                />
                <Label
                  htmlFor={`${parentId}-${subcategory.id}-${nestedIndex}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {nestedSub}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  // Function to get a valid image source
  const getValidImageSrc = (imagePath: string | undefined | null): string => {
    // If imagePath is undefined, null, or an empty string, return a placeholder
    if (!imagePath || imagePath === "") {
      return "/placeholder.svg?height=96&width=96"
    }
    return imagePath
  }

  return (
    <div className="space-y-6">
      {filteredCategories.map((category, index) => (
        <Accordion
          key={category.id}
          type="single"
          collapsible
          value={expandedCategories.includes(category.id) ? category.id : undefined}
          onValueChange={(value) => {
            if (value) {
              setExpandedCategories((prev) => (prev.includes(category.id) ? prev : [...prev, category.id]))
            } else {
              setExpandedCategories((prev) => prev.filter((id) => id !== category.id))
            }
          }}
          className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md"
        >
          <AccordionItem value={category.id}>
            <AccordionTrigger className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-md shadow-md border border-gray-200">
                  <Image
                    src={getValidImageSrc(category.image) || "/placeholder.svg"}
                    alt={category.title}
                    fill
                    style={{ objectFit: "cover" }}
                    className="hover:scale-110 transition-transform duration-300"
                    sizes="(max-width: 768px) 96px, 96px"
                    priority={index < 3}
                  />
                </div>
                <h3 className="text-xl font-semibold text-left">{category.title}</h3>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 py-4 bg-gray-50">
              <div className="space-y-4">
                {Array.isArray(category.subcategories) &&
                  category.subcategories.map((subcategory, index) =>
                    renderSubcategory(category.id, subcategory, index),
                  )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ))}
      {filteredCategories.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No categories match your search. Try a different term or suggest a new category.
          </p>
        </div>
      )}
    </div>
  )
}

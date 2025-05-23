// This file contains the category data used in the CategorySelector component
// Moving it outside the component prevents it from being recreated on every render

export const categories = [
  {
    id: "homeLawnLabor",
    title: "Home, Lawn, and Manual Labor",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/housebuilding-2Ee0Pra1CpA9xBNHU4c5g7qucnBqHE.png", // housebuilding.png
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
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/retail02-PWtKtPOE0qcIIeje2E6crDrL529eTV.png", // retail02.png
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
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/travel-cRSfCiJRrv8nJvyCPyYr5XlEKRKrY4.png", // travel.png
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
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Tailor-Ll57NPmzPURm0U8kNHxZEYqs8dPD0Y.png", // Tailor.png
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
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/fineArt-g1djwriCCMnMFKsZHa0GREE7PU4be1.png", // fineArt.png
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
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/physicalRehab-OP1TJbwVlpfhhevnkYpk6ZQqMVP2rd.png", // physicalRehab.png
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
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/finance-fqVQ0TmI2kFehcFP7kIOji08oIBhqX.png", // finance.png
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
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/wedding-events-MgUtHJRBQ04ooMmbX5ZuIq4L9m2KqI.png", // wedding-events.png
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
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cat%20and%20dog-UHW1HU5Xs0PMdXJLC66zBYViQu0jx9.png", // cat and dog.png
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
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/tutoring-lks6Tjoe1sJjtXJ7OdS2uje11BUiIL.png", // tutoring.png
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
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/realitor003-xqIaDhmbEuAgatSXkskyV0Ulolsmr5.png", // realitor003.png
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
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/baseball-aixRgKdF2ejVmCFWkhcEu2wlT9pXor.png", // baseball.png
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
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/music%20lesson-I1NMnc8dVkG1C6rIOTc5mSghexlmxd.png", // music lesson.png
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
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/home%20health-TftlLaWe43Ltg5qYUWgJyVrfgSfMNd.png", // home health.png
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
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/automech-7SsSfk6EEbz85wtCrG6GZJLEEut0xJ.png", // automech.png
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
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/haircutting-m6QfXr3W3dUfuj4MZFT90WMNtjed8T.png", // haircutting.png
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
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/doctor-3jjcpWmjxqxLZELTMa9v1TaR1U9TgB.png", // doctor.png
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
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/couseling-NTdbl5SQdjHcW9cZCMlFgPSgMin6Ue.png", // couseling.png
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
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/computer-lox6P5znlsextHA6c7vUkXZNkr2d3q.png", // computer.png
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
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/food%20service-DMhVnw8lOLmeSJkRwocWVAaupQmOgz.png", // food service.png
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
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/assistant-i6Erbhskr6ObActF7XMV9fJslboNmi.png", // assistant.png
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
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/funeral-TnpegJLL7ue38d0l8qq9dF7O4Q8ND9.png", // Updated to the new funeral director image
    subcategories: ["Funeral Homes", "Cemetaries", "Florists", "Headstones/ Monuments", "Caskets and Urns"],
  },
  {
    id: "lawyers",
    title: "Lawyers",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lawyer-DoIQHo7vo03r1owabcFTTLMXiPZ91v.png", // lawyer001.png
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
export const flattenSubcategories = (category: any) => {
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

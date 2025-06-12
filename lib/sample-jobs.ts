// Sample job data generator
export function generateSampleJobs(category: string, count = 5) {
  const companies = [
    "Acme Corporation",
    "Globex Industries",
    "Stark Enterprises",
    "Wayne Enterprises",
    "Umbrella Corp",
    "Cyberdyne Systems",
    "Initech",
    "Massive Dynamic",
    "Soylent Corp",
    "Weyland-Yutani",
  ]

  const locations = [
    "New York, NY",
    "Los Angeles, CA",
    "Chicago, IL",
    "Houston, TX",
    "Phoenix, AZ",
    "Philadelphia, PA",
    "San Antonio, TX",
    "San Diego, CA",
  ]

  const jobTypes = ["Full-time", "Part-time", "Contract", "Temporary", "Internship"]

  const timeFrames = ["Today", "Yesterday", "2 days ago", "3 days ago", "1 week ago"]

  // Category-specific job titles
  const jobTitlesByCategory: Record<string, string[]> = {
    "office-work": [
      "Administrative Assistant",
      "Office Manager",
      "Receptionist",
      "Executive Assistant",
      "Data Entry Specialist",
      "Customer Service Representative",
    ],
    "factory-work": [
      "Assembly Line Worker",
      "Production Supervisor",
      "Quality Control Inspector",
      "Warehouse Associate",
      "Machine Operator",
      "Packaging Specialist",
    ],
    "manual-labor": [
      "Construction Worker",
      "Landscaper",
      "Moving Specialist",
      "General Laborer",
      "Demolition Worker",
      "Excavation Specialist",
    ],
    medical: [
      "Medical Assistant",
      "Nurse Practitioner",
      "Healthcare Administrator",
      "Medical Receptionist",
      "Pharmacy Technician",
      "Medical Records Clerk",
    ],
    "non-medical-care": [
      "Elderly Caregiver",
      "Childcare Provider",
      "Home Health Aide",
      "Personal Care Assistant",
      "Companion Caregiver",
      "Respite Care Provider",
    ],
    "food-service": [
      "Restaurant Server",
      "Line Cook",
      "Bartender",
      "Food Prep Worker",
      "Catering Assistant",
      "Barista",
    ],
    retail: [
      "Sales Associate",
      "Retail Manager",
      "Cashier",
      "Visual Merchandiser",
      "Inventory Specialist",
      "Store Greeter",
    ],
    transportation: [
      "Delivery Driver",
      "Truck Driver",
      "Courier",
      "Logistics Coordinator",
      "Fleet Manager",
      "Dispatcher",
    ],
    education: [
      "Teacher Assistant",
      "Substitute Teacher",
      "Tutor",
      "School Administrator",
      "Education Coordinator",
      "After-School Program Leader",
    ],
    technology: [
      "IT Support Specialist",
      "Help Desk Technician",
      "Network Administrator",
      "Software Tester",
      "Technical Support Representative",
      "Computer Technician",
    ],
    "professional-services": [
      "Accounting Clerk",
      "Legal Assistant",
      "Consultant",
      "Financial Advisor",
      "Insurance Agent",
      "Tax Preparer",
    ],
    "skilled-trades": ["Electrician", "Plumber", "Carpenter", "HVAC Technician", "Welder", "Machinist"],
    "arts-entertainment": [
      "Graphic Designer",
      "Event Coordinator",
      "Production Assistant",
      "Photographer",
      "Audio/Visual Technician",
      "Stage Hand",
    ],
    "protection-services": [
      "Security Guard",
      "Loss Prevention Specialist",
      "Safety Officer",
      "Fire Safety Inspector",
      "Patrol Officer",
      "Security System Installer",
    ],
    "agriculture-animal-care": [
      "Farm Worker",
      "Veterinary Assistant",
      "Animal Caretaker",
      "Greenhouse Worker",
      "Livestock Handler",
      "Pet Groomer",
    ],
    "charity-services": [
      "Volunteer Coordinator",
      "Fundraising Assistant",
      "Community Outreach Specialist",
      "Donation Processor",
      "Grant Writer",
      "Charity Event Organizer",
    ],
    "part-time-seasonal": [
      "Seasonal Retail Associate",
      "Holiday Helper",
      "Summer Camp Counselor",
      "Event Staff",
      "Weekend Associate",
      "On-Call Assistant",
    ],
  }

  // Category-specific descriptions
  const descriptionsByCategory: Record<string, string[]> = {
    "office-work": [
      "Join our team in a professional office environment. Responsibilities include administrative tasks, customer service, and general office support.",
      "We're looking for organized individuals with excellent communication skills to help manage our busy office.",
    ],
    "factory-work": [
      "Work in our state-of-the-art manufacturing facility. Experience with production equipment and safety protocols preferred.",
      "Join our production team to assemble, package, and inspect products in a fast-paced environment.",
    ],
    "manual-labor": [
      "Physical position requiring lifting, carrying, and manual tasks. Must be able to work in various weather conditions.",
      "Looking for hardworking individuals for construction, landscaping, or moving services. Experience a plus but not required.",
    ],
    medical: [
      "Join our healthcare team to provide support in a medical setting. Certification or relevant experience required.",
      "Work alongside medical professionals to ensure quality patient care and efficient operations.",
    ],
    "non-medical-care": [
      "Provide compassionate care and assistance to individuals needing support with daily activities.",
      "Looking for caring individuals to help with companionship, light housekeeping, and personal care assistance.",
    ],
    "food-service": [
      "Join our food service team to prepare and serve quality food in a fast-paced environment.",
      "Looking for energetic team members with a passion for customer service and food preparation.",
    ],
    retail: [
      "Help customers find products, process transactions, and maintain store appearance in our retail location.",
      "Join our sales team to provide excellent customer service while meeting sales goals.",
    ],
    transportation: [
      "Transport goods or people safely and efficiently. Valid driver's license and clean driving record required.",
      "Looking for reliable drivers to handle deliveries, pickups, or passenger transportation.",
    ],
    education: [
      "Work in an educational setting to support student learning and development.",
      "Join our team to assist with teaching, tutoring, or educational program administration.",
    ],
    technology: [
      "Provide technical support and troubleshooting for hardware, software, or network issues.",
      "Looking for tech-savvy individuals to help maintain and support our IT infrastructure.",
    ],
    "professional-services": [
      "Provide specialized professional services in fields such as accounting, legal, or consulting.",
      "Join our team of professionals to deliver high-quality services to our clients.",
    ],
    "skilled-trades": [
      "Use your specialized trade skills to install, repair, or maintain systems and structures.",
      "Looking for qualified tradespeople with relevant certifications and experience.",
    ],
    "arts-entertainment": [
      "Work in a creative environment supporting arts, media, or entertainment productions.",
      "Join our team to help create, produce, or support artistic and entertainment endeavors.",
    ],
    "protection-services": [
      "Help maintain safety and security through monitoring, patrolling, or emergency response.",
      "Looking for detail-oriented individuals to help protect people, property, or assets.",
    ],
    "agriculture-animal-care": [
      "Work with plants, animals, or agricultural operations to ensure proper care and maintenance.",
      "Join our team to help with farming, animal care, or related agricultural activities.",
    ],
    "charity-services": [
      "Support our nonprofit mission through fundraising, outreach, or program coordination.",
      "Looking for passionate individuals to help make a difference in our community.",
    ],
    "part-time-seasonal": [
      "Flexible position with reduced or seasonal hours to accommodate various schedules.",
      "Perfect opportunity for students, retirees, or those seeking supplemental income.",
    ],
  }

  // Generate salary ranges based on category
  const getSalaryRange = (category: string) => {
    const baseSalaries: Record<string, [number, number]> = {
      "office-work": [35000, 55000],
      "factory-work": [30000, 50000],
      "manual-labor": [30000, 45000],
      medical: [40000, 70000],
      "non-medical-care": [28000, 40000],
      "food-service": [25000, 40000],
      retail: [25000, 45000],
      transportation: [35000, 65000],
      education: [30000, 55000],
      technology: [45000, 90000],
      "professional-services": [50000, 100000],
      "skilled-trades": [40000, 80000],
      "arts-entertainment": [30000, 60000],
      "protection-services": [35000, 60000],
      "agriculture-animal-care": [25000, 45000],
      "charity-services": [30000, 50000],
      "part-time-seasonal": [15, 25], // Hourly for part-time
    }

    const [min, max] = baseSalaries[category] || [30000, 60000]

    // For part-time, return hourly rate
    if (category === "part-time-seasonal") {
      return `$${min}-$${max}/hour`
    }

    // For full-time, return annual salary
    return `$${min.toLocaleString()}-$${max.toLocaleString()}/year`
  }

  // Generate sample jobs
  return Array.from({ length: count }, (_, i) => {
    const titles = jobTitlesByCategory[category] || ["General Associate", "Team Member", "Entry Level Position"]
    const descriptions = descriptionsByCategory[category] || [
      "Join our team in this exciting role. Various responsibilities based on department needs.",
    ]

    return {
      id: `job-${category}-${i + 1}`,
      title: titles[i % titles.length],
      company: companies[Math.floor(Math.random() * companies.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      salary: getSalaryRange(category),
      type: jobTypes[Math.floor(Math.random() * jobTypes.length)],
      posted: timeFrames[Math.floor(Math.random() * timeFrames.length)],
      description: descriptions[i % descriptions.length],
      logo: i % 3 === 0 ? `/placeholder.svg?height=100&width=100&query=company+logo+${i}` : undefined,
    }
  })
}

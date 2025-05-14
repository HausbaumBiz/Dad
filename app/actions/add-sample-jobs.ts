"use server"

import { kv } from "@/lib/redis"
import { v4 as uuidv4 } from "uuid"

export async function addSampleJobsForBusiness(businessId: string) {
  try {
    if (!businessId) {
      return { success: false, message: "No business ID provided" }
    }

    console.log(`Adding sample jobs for business ID: ${businessId}`)

    // Create sample job data
    const sampleJobs = [
      {
        jobTitle: "Funeral Director Assistant",
        jobDescription:
          "Assist the funeral director in all aspects of funeral service, including meeting with families, arranging services, and coordinating with vendors. Help with administrative tasks and ensure all paperwork is properly completed.",
        qualifications:
          "Associate's degree in Mortuary Science preferred. Compassionate demeanor and excellent communication skills required. Must be able to work weekends and evenings as needed.",
        businessName: "Peaceful Passages Funeral Home",
        businessDescription: "Family-owned funeral home serving the community since 1985.",
        businessAddress: "123 Memorial Lane, Anytown, USA",
        workHours: "Full-time, including some weekends and evenings",
        contactEmail: "careers@peacefulpassages.com",
        contactName: "John Smith, Funeral Director",
        payType: "hourly",
        hourlyMin: "18",
        hourlyMax: "25",
        categories: ["Mortuary Services", "Customer Service"],
        benefits: {
          healthInsurance: {
            enabled: true,
            details: "Full medical, dental, and vision after 90 days",
          },
          paidTimeOff: {
            enabled: true,
            details: "2 weeks per year",
          },
          retirementPlan: {
            enabled: true,
            details: "401(k) with 3% match",
          },
          flexibleScheduling: {
            enabled: true,
          },
        },
      },
      {
        jobTitle: "Mortuary Technician",
        jobDescription:
          "Responsible for embalming and preparation of the deceased. Assist with dressing, cosmetizing, and casketing. Maintain preparation room equipment and supplies. Ensure compliance with all health and safety regulations.",
        qualifications:
          "Associate's degree in Mortuary Science and valid state license required. 2+ years experience preferred. Detail-oriented with strong technical skills.",
        businessName: "Peaceful Passages Funeral Home",
        businessDescription: "Family-owned funeral home serving the community since 1985.",
        businessAddress: "123 Memorial Lane, Anytown, USA",
        workHours: "Full-time, flexible schedule",
        contactEmail: "careers@peacefulpassages.com",
        contactName: "John Smith, Funeral Director",
        payType: "salary",
        salaryMin: "45000",
        salaryMax: "60000",
        categories: ["Mortuary Services", "Technical"],
        benefits: {
          healthInsurance: {
            enabled: true,
            details: "Full medical, dental, and vision after 90 days",
          },
          paidTimeOff: {
            enabled: true,
            details: "2 weeks per year",
          },
          retirementPlan: {
            enabled: true,
            details: "401(k) with 3% match",
          },
          continuingEducation: {
            enabled: true,
            details: "Annual allowance for professional development",
          },
        },
      },
      {
        jobTitle: "Funeral Service Greeter",
        jobDescription:
          "Welcome and assist families and guests at funeral services. Distribute memorial programs, direct visitors to appropriate areas, and provide general assistance as needed. Help maintain the facility's appearance and cleanliness.",
        qualifications:
          "High school diploma or equivalent. Previous customer service experience preferred. Must be compassionate, respectful, and well-groomed.",
        businessName: "Peaceful Passages Funeral Home",
        businessDescription: "Family-owned funeral home serving the community since 1985.",
        businessAddress: "123 Memorial Lane, Anytown, USA",
        workHours: "Part-time, as needed for services",
        contactEmail: "careers@peacefulpassages.com",
        contactName: "John Smith, Funeral Director",
        payType: "hourly",
        hourlyMin: "15",
        hourlyMax: "18",
        categories: ["Mortuary Services", "Customer Service"],
        benefits: {
          flexibleScheduling: {
            enabled: true,
          },
          paidTraining: {
            enabled: true,
          },
        },
      },
    ]

    // Save each job to Redis
    const jobIds = []
    for (const jobData of sampleJobs) {
      const jobId = uuidv4()

      // Create the job listing object
      const jobListing = {
        id: jobId,
        businessId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        logoUrl: null,
        logoId: null,
        ...jobData,
      }

      // Save to Redis
      const key = `job:${businessId}:${jobId}`
      await kv.set(key, JSON.stringify(jobListing))
      jobIds.push(jobId)
    }

    // Save to job index for this business
    const jobsKey = `jobs:${businessId}`
    const existingJobs = (await kv.get<string[]>(jobsKey)) || []
    await kv.set(jobsKey, [...existingJobs, ...jobIds])

    return {
      success: true,
      message: `Added ${sampleJobs.length} sample jobs for business ID: ${businessId}`,
      jobIds,
    }
  } catch (error) {
    console.error("Error adding sample jobs:", error)
    return {
      success: false,
      message: `Error adding sample jobs: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

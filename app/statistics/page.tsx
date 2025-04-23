"use client"

import { useState } from "react"
import Image from "next/image"
import { MainHeader } from "@/components/main-header"
import { MainFooter } from "@/components/main-footer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function StatisticsPage() {
  const [activeTab, setActiveTab] = useState("overview")

  // Sample data for awards
  const awards = [
    { id: 1, name: "5 Reviews", image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/5-XXbasTPRdhijVULbzWLdhhO5VXLBIl.png", unlocked: false },
    { id: 2, name: "10 Reviews", image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/10-mCfMVYva2OJFWDVunu4j7xQxDPLI30.png", unlocked: false },
    { id: 3, name: "25 Reviews", image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/25-4-tOMvN86hcimeoIQC4tpVGuo2nqtoJP.png", unlocked: false },
    { id: 4, name: "50 Reviews", image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/50-2-tgvmD4HzJ11m4h3EmJczCHMAyXQKIt.png", unlocked: false },
    {
      id: 5,
      name: "Quality",
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/quality-QjhKw0vxK2AcjsXlQ5zH9bUet8u1Fu.png",
      unlocked: false,
    },
    {
      id: 6,
      name: "On Budget",
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/onbudget-lT4a3ega5RtBQbrWCP6lhmC7pPe33A.png",
      unlocked: false,
    },
    {
      id: 7,
      name: "Kindness",
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/Kindness-HJQxl9RBay08M467uuvppCrPPYUww5.png",
      unlocked: false,
    },
    {
      id: 8,
      name: "Keeping Informed",
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/keepinginformed02-r27QrB4vwJ2IHUtyACOfiLtxnzjnHw.png",
      unlocked: false,
    },
    {
      id: 9,
      name: "Expert",
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/Expert-QVOr3upidxlzQ8tODpAEbNyCaHmZkg.png",
      unlocked: false,
    },
    {
      id: 10,
      name: "Dependability",
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/dependability-3uL8ZAla0UzLWdvoQ8nyLH2JI4lPzi.png",
      unlocked: false,
    },
    {
      id: 11,
      name: "Customer Service",
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/CustomerServic-2-eVctv27m01myFPW9mAhgfHGtoECddh.png",
      unlocked: false,
    },
  ]

  // Sample data for customer ratings
  const ratings = [
    {
      question: "How would you rate the quality of the service you received?",
      rating: "Not available/5",
    },
    {
      question: "Was the final cost reflective of the quoted cost or were added charges reasonable and explained?",
      rating: "Not available/5",
    },
    {
      question: "How would you rate the communication throughout the process?",
      rating: "Not available/5",
    },
    {
      question: "Was your hire an expert in their field?",
      rating: "Not available/5",
    },
    {
      question: "Was your hire dependable and true to their word?",
      rating: "Not available/5",
    },
    {
      question: "Was your hire professional and courteous?",
      rating: "Not available/5",
    },
  ]

  // Sample data for clicks statistics
  const clicksStats = [
    {
      title: "Profile Views",
      yourStats: "0",
      competitorStats: "145",
    },
    {
      title: "Video Views",
      yourStats: "0",
      competitorStats: "124",
    },
    {
      title: "Coupons Clipped",
      yourStats: "0",
      competitorStats: "37",
    },
    {
      title: "Job Opportunity Views",
      yourStats: "0",
      competitorStats: "43",
    },
    {
      title: "Photo Album Views",
      yourStats: "0",
      competitorStats: "89",
    },
    {
      title: "Phone Number Clicks",
      yourStats: "0",
      competitorStats: "56",
    },
    {
      title: "Website Clicks",
      yourStats: "0",
      competitorStats: "72",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16">
              <Image src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/stats002-gW6ZaTQQkxNHACfsxA0LoZMnih5oax.png" alt="Statistics" fill className="object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Statistics Dashboard</h1>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-3xl mx-auto mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="clicks">Clicks</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="outreach">Outreach</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b">
                <CardTitle className="text-teal-700">Categories</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p>This section contains category-related data.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b">
                <CardTitle className="text-teal-700">Zip Codes</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p>This section contains data about zip codes.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b">
                <CardTitle className="text-teal-700">Awards</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4 text-center">Unlocked Awards Appear in Gold</h3>
                <div className="flex flex-wrap justify-center gap-6 mb-8">
                  {awards.map((award) => (
                    <div key={award.id} className="flex flex-col items-center">
                      <div
                        className={`relative w-24 h-24 md:w-32 md:h-32 ${award.unlocked ? "" : "filter grayscale opacity-60"} transition-all hover:scale-105`}
                      >
                        <Image
                          src={award.image || "/placeholder.svg"}
                          alt={award.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <span className="text-xs mt-2 text-center text-gray-600 max-w-[100px]">{award.name}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center mt-6">
                  <Link href="/awards-explained">
                    <Button className="bg-amber-400 hover:bg-amber-500 text-black font-medium">Awards Explained</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b">
                <CardTitle className="text-teal-700">Your Customer Ratings</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {ratings.map((item, index) => (
                    <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                      <h3 className="text-lg font-medium mb-2">{item.question}</h3>
                      <p>
                        Your average rating is: <span className="text-red-500 font-medium">{item.rating}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clicks Tab */}
          <TabsContent value="clicks" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              {clicksStats.map((stat, index) => (
                <Card key={index} className="mb-4">
                  <CardHeader
                    className={`${index % 2 === 0 ? "bg-gradient-to-r from-teal-50 to-teal-100" : "bg-white"} border-b`}
                  >
                    <CardTitle className="text-teal-700">{stat.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-700 font-medium">Your Stats:</p>
                        <p className="text-2xl font-bold text-teal-600">{stat.yourStats}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-700 font-medium">Your Leading Competitor's Stats:</p>
                        <p className="text-2xl font-bold text-gray-600">{stat.competitorStats}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details">
            <Card>
              <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b">
                <CardTitle className="text-teal-700">Detailed Analytics</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <p>
                  Add real-time updated pie chart of top 5 zip codes searches that lead to their page. Make suggestions
                  of surrounding zip codes to add for more traffic.
                </p>
                <p>Add a line graph of interactions with the ad over time.</p>
                <p>Bar graph of "Your Services" mostly searched.</p>
                <p>Outside links that lead to the ad. Suggestions on where competitors are getting links.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Outreach Tab */}
          <TabsContent value="outreach">
            <Card>
              <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b">
                <CardTitle className="text-teal-700">Outreach Tools</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="mb-4">
                  This section will provide tools to reach out to potential customers who have interacted with your
                  content.
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Masked email of registered users that have interacted with your site</li>
                  <li>Email output that sends messages to those email addresses</li>
                  <li>Change/add/delete zip codes and services</li>
                  <li>Directions on how to add links from other sites</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <MainFooter />
    </div>
  )
}

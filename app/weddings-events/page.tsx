"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function WeddingsEventsPage() {
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<{
    id: number
    name: string
    rating: number
    reviews: number
  } | null>(null)

  const filterOptions = [
    { id: "weddings1", label: "Event Halls", value: "Event Halls" },
    { id: "weddings2", label: "Tent and Chair Rentals", value: "Tent and Chair Rentals" },
    { id: "weddings3", label: "Wedding Planners", value: "Wedding Planners" },
    { id: "weddings4", label: "Food Caterers", value: "Food Caterers" },
    { id: "weddings5", label: "Bartenders", value: "Bartenders" },
    { id: "weddings6", label: "Live Music Entertainment", value: "Live Music Entertainment" },
    { id: "weddings7", label: "DJs", value: "DJs" },
    { id: "weddings8", label: "Performers", value: "Performers" },
    { id: "weddings9", label: "Tuxedo Rentals", value: "Tuxedo Rentals" },
    { id: "weddings10", label: "Limousine Services", value: "Limousine Services" },
    { id: "weddings11", label: "Tailors and Seamstresses", value: "Tailors and Seamstresses" },
    { id: "weddings12", label: "Wedding Dresses", value: "Wedding Dresses" },
    { id: "weddings13", label: "Wedding Photographers", value: "Wedding Photographers" },
    { id: "weddings14", label: "Florists", value: "Florists" },
    { id: "weddings15", label: "Wedding Cakes", value: "Wedding Cakes" },
    { id: "weddings16", label: "Marriage Officiants", value: "Marriage Officiants" },
    { id: "weddings17", label: "Other Weddings and Special Events", value: "Other Weddings and Special Events" },
  ]

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Elegant Events Planning",
      services: ["Wedding Planners", "Event Halls"],
      rating: 4.9,
      reviews: 124,
      location: "North Canton, OH",
    },
    {
      id: 2,
      name: "Delicious Catering Co.",
      services: ["Food Caterers", "Wedding Cakes"],
      rating: 4.8,
      reviews: 87,
      location: "Canton, OH",
    },
    {
      id: 3,
      name: "Capture the Moment Photography",
      services: ["Wedding Photographers"],
      rating: 4.7,
      reviews: 56,
      location: "Akron, OH",
    },
  ])

  // Mock reviews data
  const mockReviews = {
    "Elegant Events Planning": [
      {
        id: 1,
        userName: "Jessica & Mark Thompson",
        rating: 5,
        comment:
          "Elegant Events Planning made our wedding day absolutely perfect! From our first meeting to the big day, Sophia and her team were professional, attentive, and creative. They handled all the details we hadn't even thought of and coordinated with all our vendors seamlessly. Our guests are still talking about how beautiful everything was!",
        date: "2023-10-12",
      },
      {
        id: 2,
        userName: "Daniel Wilson",
        rating: 5,
        comment:
          "We hired Elegant Events for our corporate gala, and they exceeded all expectations. The venue they recommended was perfect, and they transformed it into an elegant space that impressed all our clients. Their attention to detail and ability to stay within our budget was impressive. Will definitely use them for future events.",
        date: "2023-09-05",
      },
      {
        id: 3,
        userName: "Michelle & David Rodriguez",
        rating: 4,
        comment:
          "Our wedding was beautiful thanks to Elegant Events. The only reason for 4 stars instead of 5 is that there were a few communication delays during the planning process. However, the day-of coordination was flawless, and they handled a last-minute venue issue without us even knowing until after the fact. Overall, we were very happy with their services.",
        date: "2023-11-18",
      },
      {
        id: 4,
        userName: "Sarah Johnson",
        rating: 5,
        comment:
          "I planned my daughter's sweet sixteen with Elegant Events, and it was the talk of the town! They came up with a theme that perfectly matched her personality and executed it beautifully. The decorations, entertainment, and food were all coordinated perfectly. My daughter felt like a princess, and her friends were amazed. Worth every penny!",
        date: "2023-08-22",
      },
    ],
    "Delicious Catering Co.": [
      {
        id: 1,
        userName: "Emily & Jason Clark",
        rating: 5,
        comment:
          "The food at our wedding was AMAZING! Delicious Catering Co. created a custom menu that incorporated dishes from both our cultural backgrounds, and our guests couldn't stop raving about it. The presentation was beautiful, and the service staff was professional and attentive. Our wedding cake was not only gorgeous but also the best cake we've ever tasted!",
        date: "2023-11-02",
      },
      {
        id: 2,
        userName: "Corporate Solutions Inc.",
        rating: 4,
        comment:
          "We've used Delicious Catering for several corporate events. Their food is consistently excellent, and they're very accommodating with dietary restrictions. The only reason for 4 stars is that they were a bit late to set up at our last event, though they recovered quickly. Their appetizer selection is particularly impressive.",
        date: "2023-10-15",
      },
      {
        id: 3,
        userName: "Rebecca Martinez",
        rating: 5,
        comment:
          "Hired Delicious Catering for my parents' 50th anniversary party, and they made it so special! The food was exceptional - everyone particularly loved the beef tenderloin and seafood station. They also created a replica of my parents' original wedding cake, which brought tears to their eyes. The staff was friendly and professional throughout the event.",
        date: "2023-09-28",
      },
    ],
    "Capture the Moment Photography": [
      {
        id: 1,
        userName: "Alicia & Robert Chen",
        rating: 5,
        comment:
          "Alex from Capture the Moment is a true artist! Our wedding photos are absolutely breathtaking - he captured not just the big moments but all the small, emotional details that made our day special. He was unobtrusive during the ceremony but somehow managed to get every important shot. The album he designed for us is something we'll treasure forever.",
        date: "2023-11-15",
      },
      {
        id: 2,
        userName: "Jennifer Smith",
        rating: 5,
        comment:
          "I hired Capture the Moment for my maternity photoshoot, and I'm so glad I did! The photographer made me feel comfortable and beautiful during a time when I wasn't feeling my best. The photos are stunning - the lighting and composition are perfect. They also turned around the edited photos much faster than I expected. Highly recommend!",
        date: "2023-10-08",
      },
      {
        id: 3,
        userName: "Michael & Thomas Williams",
        rating: 4,
        comment:
          "Our engagement and wedding photos from Capture the Moment are beautiful. The photographer was creative with locations and poses, and captured our personalities perfectly. The only reason for 4 stars is that we wished there were more candid shots of our guests. That said, the formal portraits and ceremony shots are absolutely perfect.",
        date: "2023-09-20",
      },
      {
        id: 4,
        userName: "Lisa Johnson",
        rating: 5,
        comment:
          "We used Capture the Moment for our family reunion, and they did an amazing job with a large, chaotic group! They organized everyone efficiently for the group shots and then captured wonderful candid moments throughout the day. They were especially good with the children and elderly family members. The photos help us relive that special day whenever we look at them.",
        date: "2023-08-12",
      },
    ],
  }

  const handleOpenReviews = (provider: (typeof providers)[0]) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Weddings and Special Events" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="/bride.png"
            alt="Weddings and Events"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified wedding and event professionals in your area. Browse services below or use filters to narrow
            your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Experienced and professional event vendors</li>
              <li>Read reviews from other clients</li>
              <li>Compare services and rates</li>
              <li>Find everything you need for your special day in one place</li>
            </ul>
          </div>
        </div>
      </div>

      <CategoryFilter options={filterOptions} />

      <div className="space-y-6">
        {providers.map((provider) => (
          <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{provider.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{provider.location}</p>

                  <div className="flex items-center mt-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${i < Math.floor(provider.rating) ? "text-yellow-400" : "text-gray-300"}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 ml-2">
                      {provider.rating} ({provider.reviews} reviews)
                    </span>
                  </div>

                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700">Services:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {provider.services.map((service, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end justify-between">
                  <Button className="w-full md:w-auto" onClick={() => handleOpenReviews(provider)}>
                    Reviews
                  </Button>
                  <Button variant="outline" className="mt-2 w-full md:w-auto">
                    View Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={selectedProvider.name}
          reviews={mockReviews[selectedProvider.name as keyof typeof mockReviews] || []}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}

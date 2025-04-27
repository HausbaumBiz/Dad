import Image from "next/image"
import { MainHeader } from "@/components/main-header"
import { MainFooter } from "@/components/main-footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function AwardsExplainedPage() {
  // Array of award data for easy maintenance
  const awards = [
    {
      id: 1,
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/5-XXbasTPRdhijVULbzWLdhhO5VXLBIl.png",
      title: "Five 5-Star Reviews",
      description: "Five 5-Star reviews on all 6 questions.",
    },
    {
      id: 2,
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/10-mCfMVYva2OJFWDVunu4j7xQxDPLI30.png",
      title: "Ten 5-Star Reviews",
      description: "Ten 5-Star reviews on all 6 questions.",
    },
    {
      id: 3,
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/25-4-tOMvN86hcimeoIQC4tpVGuo2nqtoJP.png",
      title: "Twenty-five 5-Star Reviews",
      description: "Twenty-five 5-Star reviews on all 6 questions.",
    },
    {
      id: 4,
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/50-2-tgvmD4HzJ11m4h3EmJczCHMAyXQKIt.png",
      title: "Fifty 5-Star Reviews",
      description: "Fifty 5-Star reviews on all 6 questions.",
    },
    {
      id: 5,
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/quality-QjhKw0vxK2AcjsXlQ5zH9bUet8u1Fu.png",
      title: "Quality Work",
      description: "Five 5-Star Reviews for the question: How would you rate the quality of the service you received?",
    },
    {
      id: 6,
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/onbudget-lT4a3ega5RtBQbrWCP6lhmC7pPe33A.png",
      title: "On Budget",
      description:
        "Five 5-Star Reviews for the question: Was the final cost reflective of the quoted cost or were added charges reasonable and explained?",
    },
    {
      id: 7,
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/Kindness-HJQxl9RBay08M467uuvppCrPPYUww5.png",
      title: "Professional and Courteous",
      description: "Five 5-Star Reviews for the question: Was your hire professional and courteous?",
    },
    {
      id: 8,
      image:
        "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/keepinginformed02-r27QrB4vwJ2IHUtyACOfiLtxnzjnHw.png",
      title: "Communication",
      description: "Five 5-Star Reviews for the question: How would you rate the communication throughout the process?",
    },
    {
      id: 9,
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/Expert-QVOr3upidxlzQ8tODpAEbNyCaHmZkg.png",
      title: "Expert Knowledge",
      description: "Five 5-Star Reviews for the question: Was your hire an expert in their field?",
    },
    {
      id: 10,
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/dependability-3uL8ZAla0UzLWdvoQ8nyLH2JI4lPzi.png",
      title: "Dependability",
      description: "Five 5-Star Reviews for the question: Was your hire dependable and true to their word?",
    },
    {
      id: 11,
      image:
        "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/CustomerServic-2-eVctv27m01myFPW9mAhgfHGtoECddh.png",
      title: "Customer Service",
      description: "Five 5-Star Reviews for the question: How would you rate the quality of the service you received?",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Awards Explained</h1>

          {/* Questions Section */}
          <Card className="mb-10">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b">
              <CardTitle className="text-teal-700">Questions Asked to Customers</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-4 text-gray-700">
                Customers are asked to rate your business on a scale of 1-5 stars for the following questions. Only
                5-star ratings will count toward earning Gold Medals.
              </p>
              <ol className="space-y-2 list-decimal list-inside text-gray-700">
                <li>How would you rate the quality of the service you received?</li>
                <li>
                  Was the final cost reflective of the quoted cost or were added charges reasonable and explained?
                </li>
                <li>How would you rate the communication throughout the process?</li>
                <li>Was your hire an expert in their field?</li>
                <li>Was your hire dependable and true to their word?</li>
                <li>Was your hire professional and courteous?</li>
              </ol>
            </CardContent>
          </Card>

          {/* Awards Gallery */}
          <div className="space-y-6">
            {awards.map((award) => (
              <Card key={award.id} className="overflow-hidden transition-all hover:shadow-md">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/4 p-6 flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
                    <div className="relative w-32 h-32">
                      <Image
                        src={award.image || "/placeholder.svg"}
                        alt={award.title}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                  <Separator className="md:hidden" />
                  <div className="md:w-3/4 p-6">
                    <h3 className="text-xl font-semibold text-teal-700 mb-2">{award.title}</h3>
                    <p className="text-gray-700">{award.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <MainFooter />
    </div>
  )
}

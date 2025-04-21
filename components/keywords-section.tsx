"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function KeywordsSection() {
  const [keywords, setKeywords] = useState(Array(10).fill(""))

  const handleKeywordChange = (index: number, value: string) => {
    const newKeywords = [...keywords]
    newKeywords[index] = value
    setKeywords(newKeywords)
  }

  const handleSubmit = () => {
    // In a real implementation, this would save the keywords
    alert("Keywords submitted!")
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Enter up to ten keywords</CardTitle>
        <p className="text-center text-gray-600">that will link customers to your Ad Box.</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {keywords.map((keyword, index) => (
            <div key={index} className="flex items-center">
              <Input
                type="text"
                placeholder={`Word ${index + 1}`}
                value={keyword}
                onChange={(e) => handleKeywordChange(index, e.target.value)}
                className="w-full"
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <Button onClick={handleSubmit}>Submit</Button>
        </div>
      </CardContent>
    </Card>
  )
}

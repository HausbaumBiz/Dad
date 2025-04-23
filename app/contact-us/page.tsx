import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, MapPin, Phone, Facebook, Twitter, Linkedin, ChevronLeft } from "lucide-react"

export default function ContactUsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="pl-0">
            <Link href="/" className="flex items-center text-primary">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 p-8 flex flex-col justify-center">
                <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
                <h2 className="text-xl text-primary mb-6">Hausbaum for Businesses and Services</h2>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-primary mr-3 mt-1" />
                    <div>
                      <p className="font-medium">Our Location</p>
                      <p>4465 Fulton Ave NW</p>
                      <p>North Canton, Ohio 44718</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-primary mr-3 mt-1" />
                    <div>
                      <p className="font-medium">Email Us</p>
                      <p>rankflv@yahoo.com</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-primary mr-3 mt-1" />
                    <div>
                      <p className="font-medium">Call Us</p>
                      <a
                        href="tel:+13304972700"
                        className="text-primary hover:underline transition-colors"
                        aria-label="Call Hausbaum at (330) 497-2700"
                      >
                        (330) 497-2700
                      </a>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-3">Connect With Us</h3>
                  <div className="flex space-x-4">
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full text-primary hover:text-primary hover:border-primary"
                    >
                      <Facebook className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full text-primary hover:text-primary hover:border-primary"
                    >
                      <Twitter className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full text-primary hover:text-primary hover:border-primary"
                    >
                      <Linkedin className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="md:w-1/2">
                <div className="h-full relative">
                  <Image src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/ContactUs-lowres-SBPMw2x3C5R3BpcumbNs0znhPj8sXF.png" alt="Contact Hausbaum" fill className="object-cover" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="bg-primary text-white py-8 relative">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "url('/texture0079.png')",
            backgroundRepeat: "repeat",
            mixBlendMode: "multiply",
          }}
        ></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-bold">Hausbaum</h2>
              <p className="text-sm mt-2">© {new Date().getFullYear()} Hausbaum. All rights reserved.</p>
            </div>

            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" className="text-white hover:bg-primary-foreground/10">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-primary-foreground/10">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-primary-foreground/10">
                <Linkedin className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

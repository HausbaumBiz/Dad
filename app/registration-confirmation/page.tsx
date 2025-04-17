import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, ChevronLeft } from "lucide-react"

export default function RegistrationConfirmationPage({
  searchParams,
}: {
  searchParams: { email?: string }
}) {
  const email = searchParams.email || "your email"

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

        <div className="flex justify-center items-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Check your email</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4">
                We've sent a verification link to <span className="font-medium">{email}</span>
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Please check your email and click on the verification link to complete your registration. If you don't
                see the email, check your spam folder.
              </p>
              <div className="flex flex-col space-y-2">
                <Button asChild variant="outline">
                  <Link href="/business-login">Go to Login</Link>
                </Button>
                <Button variant="link" asChild>
                  <Link href="/business-register">Use a different email</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

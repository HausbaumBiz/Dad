import { verifyEmail } from "../actions/auth-actions"

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const token = searchParams.token

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Verification Link</h1>
          <p className="text-gray-600">
            The verification link is invalid. Please check your email for the correct link.
          </p>
        </div>
      </div>
    )
  }

  // Verify the email
  await verifyEmail(token)

  // The verifyEmail function will redirect to the login page if successful
  // This is just a fallback in case the redirect doesn't work
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Verifying your email...</h1>
        <p className="text-gray-600">Please wait while we verify your email address.</p>
      </div>
    </div>
  )
}

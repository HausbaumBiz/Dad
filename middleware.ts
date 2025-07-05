import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath =
    path === "/" ||
    path === "/user-login" ||
    path === "/user-register" ||
    path === "/business-login" ||
    path === "/business-register" ||
    path === "/registration-confirmation" ||
    path === "/legal-notice" ||
    path === "/contact-us" ||
    path === "/awards-explained" ||
    path.startsWith("/api/") ||
    path.startsWith("/admin") || // Make admin pages public
    path.startsWith("/_next") ||
    path.startsWith("/favicon") ||
    path.includes(".")

  // Allow all public paths
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Check for authentication cookie
  const userId = request.cookies.get("userId")?.value

  if (!userId) {
    // Redirect to login with return URL
    const loginUrl = new URL("/user-login", request.url)
    loginUrl.searchParams.set("returnTo", path)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}

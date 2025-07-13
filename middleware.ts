import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath =
    path === "/user-login" ||
    path === "/user-register" ||
    path === "/business-login" ||
    path === "/business-register" ||
    path === "/" ||
    path.startsWith("/api/") ||
    path.startsWith("/_next/") ||
    path.includes(".") || // Static files
    // Allow all category pages to be public
    path === "/home-improvement" ||
    path === "/automotive-services" ||
    path === "/elder-care" ||
    path === "/pet-care" ||
    path === "/weddings-events" ||
    path === "/fitness-athletics" ||
    path === "/education-tutoring" ||
    path === "/music-lessons" ||
    path === "/real-estate" ||
    path === "/food-dining" ||
    path === "/retail-stores" ||
    path === "/legal-services" ||
    path === "/funeral-services" ||
    path === "/personal-assistants" ||
    path === "/travel-vacation" ||
    path === "/tailoring-clothing" ||
    path === "/arts-entertainment" ||
    path === "/tech-it-services" ||
    path === "/beauty-wellness" ||
    path === "/physical-rehabilitation" ||
    path === "/medical-practitioners" ||
    path === "/mental-health" ||
    path === "/financial-services" ||
    path === "/child-care" ||
    path === "/penny-saver" ||
    path === "/job-listings" ||
    // Allow all job-listings category pages to be public
    path.startsWith("/job-listings/") ||
    // Allow subcategory pages to be public too
    path.startsWith("/home-improvement/") ||
    // More efficient way to handle all category pages
    path.match(/^\/[a-z-]+\/?$/) !== null

  // Check if path is admin-related
  const isAdminPath = path.startsWith("/admin")

  // Get authentication status from cookies
  const isAuthenticated = request.cookies.has("userId") || request.cookies.has("businessId")

  // For now, allow admin access if user is authenticated
  // TODO: Implement proper role-based admin checking
  const isAdmin = isAuthenticated // Simplified admin check for development

  // Redirect logic
  if (isAdminPath && !isAdmin) {
    // If trying to access admin pages without authentication
    return NextResponse.redirect(new URL("/user-login", request.url))
  }

  if (!isPublicPath && !isAuthenticated) {
    // If trying to access protected pages without authentication
    return NextResponse.redirect(new URL("/user-login", request.url))
  }

  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Match all paths except static files, api routes, and _next
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}

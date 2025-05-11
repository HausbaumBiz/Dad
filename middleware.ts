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
    path.includes(".") // Static files

  // Check if path is admin-related
  const isAdminPath = path.startsWith("/admin")

  // Get authentication status from cookies
  const isAuthenticated = request.cookies.has("userId") || request.cookies.has("businessId")

  // For admin paths, we might want to check for admin privileges
  // This is a simplified example - in a real app, you'd verify the user has admin role
  const isAdmin = request.cookies.has("userId") && request.cookies.get("userId")?.value === "admin-user-id"

  // Redirect logic
  if (isAdminPath && !isAdmin) {
    // If trying to access admin pages without admin privileges
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

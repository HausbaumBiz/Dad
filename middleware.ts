import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath =
    path === "/" ||
    path === "/user-login" ||
    path === "/user-register" ||
    path === "/business-login" ||
    path === "/business-register" ||
    path.startsWith("/api/") ||
    path.startsWith("/_next/") ||
    path.startsWith("/public/")

  // Check if the path requires user authentication
  const isUserPath = path.startsWith("/user-profile") || path.startsWith("/my-reviews")

  // Get the token from cookies
  const userId = request.cookies.get("userId")?.value

  // Redirect unauthenticated users to login
  if (isUserPath && !userId) {
    return NextResponse.redirect(new URL("/user-login", request.url))
  }

  // Redirect authenticated users away from login/register pages
  if ((path === "/user-login" || path === "/user-register") && userId) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}

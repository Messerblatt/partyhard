import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(request: NextRequest) {
    // Allow access to auth pages without authentication
    if (request.nextUrl.pathname.startsWith("/auth/")) {
      return NextResponse.next()
    }

    // For all other pages, authentication is required
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages without token
        if (req.nextUrl.pathname.startsWith("/auth/")) {
          return true
        }
        // For all other pages, require token
        return !!token
      },
    },
  },
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
}

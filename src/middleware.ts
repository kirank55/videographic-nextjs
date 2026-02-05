import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lightweight middleware without Prisma imports
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for session token cookie (NextAuth uses this)
  const sessionToken = request.cookies.get("authjs.session-token") || 
                       request.cookies.get("__Secure-authjs.session-token");
  const isLoggedIn = !!sessionToken;

  // Define protected routes
  const isProtectedRoute = pathname.startsWith("/dashboard") ||
                           pathname.startsWith("/editor");

  // Define auth routes (login, signup)
  const isAuthRoute = pathname.startsWith("/login") ||
                      pathname.startsWith("/signup");

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and api routes (except auth)
    "/((?!_next/static|_next/image|favicon.ico|api(?!/auth)).*)",
  ],
};

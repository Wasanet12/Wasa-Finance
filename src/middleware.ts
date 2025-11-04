import { NextRequest, NextResponse } from "next/server";

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/profile"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is a protected route
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  // If it's a protected route, check authentication
  if (isProtectedRoute) {
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("auth-token")?.value;
    const token = authHeader?.replace("Bearer ", "") || cookieToken;

    if (!token) {
      // Redirect to login if no token
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      // For now, we'll skip server-side token verification in middleware
      // and handle it in API routes and server components
      // This avoids the Firebase Admin SDK webpack issues

      // Basic token format check
      if (token.length < 10) {
        throw new Error('Invalid token format');
      }

      // Token format looks OK, proceed
      return NextResponse.next();
    } catch (error) {
      console.error('Token verification error:', error);
      // Token is invalid, redirect to login
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // For non-protected routes, proceed normally
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};

import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase/admin";
import { initializeApp } from "firebase-admin/app";
import { getApps } from "firebase-admin/app";

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    initializeApp({
      credential: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
    });
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
}

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
      // Verify the Firebase token
      const auth = getAuth();
      const decodedToken = await auth.verifyIdToken(token);

      // Token is valid, proceed
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

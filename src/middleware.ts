// MIDDLEWARE DISABLED FOR DEBUGGING
// Middleware was blocking access to dashboard after login
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // For debugging: allow all routes
  console.log('🔄 Middleware:', request.nextUrl.pathname);
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// Force Node.js runtime for middleware (better-auth requires Node.js APIs)
export const runtime = 'nodejs';

const publicRoutes = ["/admin/login", "/api/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes FIRST
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check if it's a protected admin route
  const isProtectedRoute = pathname.startsWith("/admin/");

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Get session from the request
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify admin role (plugin admin must be configured and user must be admin)
  const user = session.user as { admin?: boolean } | undefined;
  if (!user?.admin) {
    // User is authenticated but not admin - redirect to home
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

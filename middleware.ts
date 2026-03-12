import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple middleware - actual auth is handled in each page
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin"],
};

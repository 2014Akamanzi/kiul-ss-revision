import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect admin pages + admin APIs
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    // Allow login endpoint + login page
    if (pathname.startsWith("/admin/login")) return NextResponse.next();
    if (pathname === "/api/admin/login") return NextResponse.next();

    const isAdmin = req.cookies.get("kiul_admin")?.value === "1";
    if (!isAdmin) {
      // If API request, return 401
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Not authorised" }, { status: 401 });
      }
      // Otherwise redirect to login
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

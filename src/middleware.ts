import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "kiul_access";
const COOKIE_VALUE = "ok";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect only /chat for now
  if (pathname.startsWith("/chat")) {
    const cookie = req.cookies.get(COOKIE_NAME)?.value;

    if (cookie !== COOKIE_VALUE) {
      const url = req.nextUrl.clone();
      url.pathname = "/access";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Ensure middleware runs on /chat only (fast + safe)
export const config = {
  matcher: ["/chat/:path*"],
};

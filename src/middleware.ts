import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const COOKIE_NAME = "kiul_access";
const COOKIE_VALUE = "ok";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // protect chat only
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

export const config = {
  matcher: ["/chat/:path*"],
};

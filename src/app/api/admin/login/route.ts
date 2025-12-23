import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({}));

  const expected = process.env.KIUL_ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: "Server missing KIUL_ADMIN_PASSWORD" },
      { status: 500 }
    );
  }

  if (!password || password !== expected) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });

  // 7 days cookie
  res.cookies.set("kiul_admin", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}

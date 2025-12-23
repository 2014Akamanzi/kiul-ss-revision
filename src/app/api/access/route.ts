import { NextResponse } from "next/server";

const COOKIE_NAME = "kiul_access";
const COOKIE_VALUE = "ok";

function getAllowedCodes(): string[] {
  const raw = process.env.KIUL_ACCESS_CODES || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const code = (body?.code || "").toString().trim();

  if (!code) {
    return NextResponse.json({ error: "Enter an access code." }, { status: 400 });
  }

  const allowed = getAllowedCodes();
  if (!allowed.includes(code)) {
    return NextResponse.json({ error: "Invalid access code." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });

  res.cookies.set({
    name: COOKIE_NAME,
    value: COOKIE_VALUE,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return res;
}

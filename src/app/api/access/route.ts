import { NextResponse } from "next/server";

const COOKIE_NAME = "kiul_access";
const COOKIE_VALUE = "ok";

/**
 * Access codes (MVP)
 * ------------------
 * For MVP we store allowed codes in an environment variable:
 *   KIUL_ACCESS_CODES="CODE1,CODE2,CODE3"
 *
 * Example:
 *   KIUL_ACCESS_CODES="KIUL-PILOT-001,KIUL-MIKOCHENI-2026"
 */
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
  const ok = allowed.includes(code);

  if (!ok) {
    return NextResponse.json({ error: "Invalid access code." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });

  // Set cookie for 30 days
  res.cookies.set({
    name: COOKIE_NAME,
    value: COOKIE_VALUE,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return res;
}

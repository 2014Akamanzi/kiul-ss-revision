import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * TEMP: Prisma removed.
 * This route is disabled for now to keep builds stable.
 */
export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Admin access-code API disabled (Prisma removed)" },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Admin access-code API disabled (Prisma removed)" },
    { status: 410 }
  );
}

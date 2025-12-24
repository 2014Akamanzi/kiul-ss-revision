import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAdmin(req: NextRequest) {
  const cookie = req.cookies.get("kiul_admin")?.value;
  return cookie === "1";
}

function toCsvString(v: unknown): string {
  if (Array.isArray(v)) {
    return v
      .map((x) => String(x).trim())
      .filter(Boolean)
      .join(", ");
  }
  if (typeof v === "string") return v.trim();
  return "";
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.accessCode.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items: rows });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));

  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const schoolName =
    typeof body.schoolName === "string" ? body.schoolName.trim() : "";

  // IMPORTANT: Prisma schema expects a STRING here (not string[])
  const allowedLevels = toCsvString(body.allowedLevels);

  const status =
    body.status === "ACTIVE" || body.status === "DISABLED"
      ? body.status
      : "ACTIVE";

  try {
    const created = await prisma.accessCode.create({
      data: {
        code,
        schoolName, // ✅ always a string (never null)
        allowedLevels, // ✅ always a string
        status,
      },
    });

    return NextResponse.json({ ok: true, item: created });
  } catch (e: any) {
    // Unique constraint, etc.
    return NextResponse.json(
      { error: "Failed to create code", details: String(e?.message ?? e) },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await prisma.accessCode.update({
    where: { id },
    data: { status: "DISABLED" },
  });

  return NextResponse.json({ ok: true });
}

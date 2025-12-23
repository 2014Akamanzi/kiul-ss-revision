import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Status = "ACTIVE" | "DISABLED";

function normalizeAllowedLevels(input: unknown): string {
  // Store as a comma-separated string in DB (simple + reliable)
  if (Array.isArray(input)) {
    return input.map(String).map(s => s.trim()).filter(Boolean).join(",");
  }
  if (typeof input === "string") return input;
  return "";
}

export async function GET() {
  try {
    const rows = await prisma.accessCode.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ ok: true, rows });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Failed to fetch codes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const code = typeof body.code === "string" ? body.code.trim() : "";
    const schoolName = typeof body.schoolName === "string" ? body.schoolName.trim() : "";
    const allowedLevels = normalizeAllowedLevels(body.allowedLevels);
    const status: Status = body.status === "DISABLED" ? "DISABLED" : "ACTIVE";

    if (!code) {
      return NextResponse.json({ ok: false, error: "Missing code" }, { status: 400 });
    }

    const created = await prisma.accessCode.create({
      data: {
        code,
        schoolName,      // ✅ never null
        allowedLevels,   // ✅ always string
        status,
      },
    });

    return NextResponse.json({ ok: true, created });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Failed to create code" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
    }

    const updated = await prisma.accessCode.update({
      where: { id },
      data: { status: "DISABLED" },
    });

    return NextResponse.json({ ok: true, updated });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Failed to disable code" }, { status: 500 });
  }
}

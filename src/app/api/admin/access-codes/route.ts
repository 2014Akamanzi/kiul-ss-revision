import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireAdmin(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  // simple cookie check (matches what your login route sets)
  const ok = cookie.includes("kiul_admin=1");
  return ok;
}

export async function GET(req: Request) {
  try {
    if (!requireAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const codes = await prisma.accessCode.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, codes });
  } catch (err) {
    console.error("GET /api/admin/access-codes failed:", err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    if (!requireAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const code = String(body?.code || "").trim();
    const schoolName = String(body?.schoolName || "").trim();
    const allowedLevels = Array.isArray(body?.allowedLevels) ? body.allowedLevels : [];
    const status = String(body?.status || "ACTIVE").toUpperCase();

    if (!code) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    const created = await prisma.accessCode.create({
      data: {
        code,
        schoolName: schoolName || null,
        allowedLevels,
        status,
      },
    });

    return NextResponse.json({ ok: true, created });
  } catch (err) {
    console.error("POST /api/admin/access-codes failed:", err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    if (!requireAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await prisma.accessCode.update({
      where: { id },
      data: { status: "DISABLED" },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/admin/access-codes failed:", err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}

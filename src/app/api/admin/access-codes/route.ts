import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET – list all access codes
 */
export async function GET() {
  const codes = await prisma.accessCode.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(codes);
}

/**
 * POST – create a new access code
 */
export async function POST(req: Request) {
  const body = await req.json();

  const {
    code,
    schoolName = "",
    allowedLevels = [],
    status = "ACTIVE",
  } = body;

  if (!code || !Array.isArray(allowedLevels)) {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 }
    );
  }

  const created = await prisma.accessCode.create({
    data: {
      code,
      schoolName,
      allowedLevels: allowedLevels.join(","), // ✅ FIX
      status,
    },
  });

  return NextResponse.json(created);
}

/**
 * DELETE – disable an access code
 */
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing id" },
      { status: 400 }
    );
  }

  await prisma.accessCode.update({
    where: { id },
    data: { status: "DISABLED" },
  });

  return NextResponse.json({ ok: true });
}

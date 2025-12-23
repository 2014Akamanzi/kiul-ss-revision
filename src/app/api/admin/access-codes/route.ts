import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();

  const {
    code,
    schoolName = "",
    allowedLevels = [],
    status = "ACTIVE",
  } = body;

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const record = await prisma.accessCode.create({
    data: {
      code: String(code),
      schoolName: String(schoolName),
      allowedLevels,
      status,
    },
  });

  return NextResponse.json(record);
}

export async function GET() {
  const records = await prisma.accessCode.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(records);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await prisma.accessCode.update({
    where: { id },
    data: { status: "DISABLED" },
  });

  return NextResponse.json({ ok: true });
}

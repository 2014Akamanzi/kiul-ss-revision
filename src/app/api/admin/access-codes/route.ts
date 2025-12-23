import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const items = await prisma.accessCode.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const code = (body?.code || "").trim();

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  try {
    const created = await prisma.accessCode.create({
      data: {
        code,
        schoolName: body?.schoolName || null,
        allowedLevels: body?.allowedLevels || null,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ created });
  } catch (e: any) {
    // likely unique constraint
    return NextResponse.json(
      { error: "Could not create (maybe duplicate code?)" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request) {
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
}

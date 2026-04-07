import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await requireSession();

    const users = await prisma.user.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ users });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await requireSession();

    const pipeline = await prisma.pipeline.findFirst({
      where: { organizationId: session.user.organizationId, isDefault: true },
      include: {
        stages: {
          orderBy: { order: "asc" },
          include: {
            deals: {
              where: { status: "open" },
              orderBy: { updatedAt: "desc" },
              include: {
                lead: { select: { id: true, name: true, company: true, email: true, score: true } },
                owner: { select: { id: true, name: true, email: true } },
                _count: { select: { activities: true } },
              },
            },
          },
        },
      },
    });

    if (!pipeline) {
      return NextResponse.json({ error: "No pipeline found" }, { status: 404 });
    }

    return NextResponse.json(pipeline);
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

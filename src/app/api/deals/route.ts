import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const CreateDealSchema = z.object({
  title: z.string().min(1),
  value: z.number().min(0).default(0),
  currency: z.string().default("USD"),
  expectedCloseDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  probability: z.number().min(0).max(100).default(20),
  notes: z.string().optional(),
  stageId: z.string(),
  leadId: z.string().optional(),
  ownerId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const stageId = searchParams.get("stageId") || "";
    const status = searchParams.get("status") || "";
    const ownerId = searchParams.get("ownerId") || "";
    const search = searchParams.get("search") || "";

    const where = {
      organizationId: session.user.organizationId,
      ...(stageId && { stageId }),
      ...(status && { status }),
      ...(ownerId && { ownerId }),
      ...(search && {
        OR: [
          { title: { contains: search } },
          { lead: { name: { contains: search } } },
          { lead: { company: { contains: search } } },
        ],
      }),
    };

    const deals = await prisma.deal.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        stage: true,
        lead: true,
        owner: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { activities: true, proposals: true } },
      },
    });

    return NextResponse.json({ deals });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const data = CreateDealSchema.parse(body);

    const deal = await prisma.deal.create({
      data: {
        ...data,
        organizationId: session.user.organizationId,
        ownerId: data.ownerId || session.user.id,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
      },
      include: { stage: true, lead: true, owner: { select: { id: true, name: true, email: true, role: true } } },
    });

    // Log stage_change activity
    await prisma.activity.create({
      data: {
        type: "stage_change",
        title: `Deal created in ${deal.stage.name}`,
        dealId: deal.id,
        leadId: deal.leadId || undefined,
        userId: session.user.id,
        metadata: JSON.stringify({ stageId: deal.stageId, stageName: deal.stage.name }),
      },
    });

    return NextResponse.json(deal, { status: 201 });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 });
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

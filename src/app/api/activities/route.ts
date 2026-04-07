import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const CreateActivitySchema = z.object({
  type: z.enum(["email", "call", "meeting", "note", "task", "stage_change"]),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["pending", "completed", "cancelled"]).default("pending"),
  direction: z.enum(["inbound", "outbound"]).optional(),
  dueDate: z.string().optional(),
  dealId: z.string().optional(),
  leadId: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const dealId = searchParams.get("dealId") || "";
    const leadId = searchParams.get("leadId") || "";
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    const activities = await prisma.activity.findMany({
      where: {
        userId: undefined,
        ...(dealId && { dealId }),
        ...(leadId && { leadId }),
        ...(type && { type }),
        ...(status && { status }),
        OR: [
          { deal: { organizationId: session.user.organizationId } },
          { lead: { organizationId: session.user.organizationId } },
          { userId: session.user.id },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        deal: { select: { id: true, title: true } },
        lead: { select: { id: true, name: true, company: true } },
      },
    });

    return NextResponse.json({ activities });
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
    const data = CreateActivitySchema.parse(body);

    const activity = await prisma.activity.create({
      data: {
        ...data,
        userId: session.user.id,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        metadata: JSON.stringify(data.metadata),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 });
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

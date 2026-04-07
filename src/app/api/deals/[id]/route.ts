import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const deal = await prisma.deal.findFirst({
      where: { id, organizationId: session.user.organizationId },
      include: {
        stage: { include: { pipeline: { include: { stages: { orderBy: { order: "asc" } } } } } },
        lead: true,
        owner: { select: { id: true, name: true, email: true, role: true } },
        activities: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: "desc" },
        },
        proposals: { orderBy: { createdAt: "desc" } },
        _count: { select: { activities: true, proposals: true } },
      },
    });

    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(deal);
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = await req.json();

    const deal = await prisma.deal.findFirst({
      where: { id, organizationId: session.user.organizationId },
      include: { stage: true },
    });
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.deal.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.value !== undefined && { value: body.value }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.probability !== undefined && { probability: body.probability }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.lostReason !== undefined && { lostReason: body.lostReason }),
        ...(body.ownerId !== undefined && { ownerId: body.ownerId }),
        ...(body.expectedCloseDate !== undefined && {
          expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : null,
        }),
        ...(body.stageId !== undefined && { stageId: body.stageId }),
      },
      include: {
        stage: true,
        lead: true,
        owner: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    // Log stage change
    if (body.stageId && body.stageId !== deal.stageId) {
      const newStage = await prisma.stage.findUnique({ where: { id: body.stageId } });
      await prisma.activity.create({
        data: {
          type: "stage_change",
          title: `Moved from ${deal.stage.name} to ${newStage?.name}`,
          dealId: id,
          leadId: deal.leadId || undefined,
          userId: session.user.id,
          metadata: JSON.stringify({
            fromStageId: deal.stageId,
            fromStageName: deal.stage.name,
            toStageId: body.stageId,
            toStageName: newStage?.name,
          }),
        },
      });
    }

    // Log status change
    if (body.status && body.status !== deal.status) {
      await prisma.activity.create({
        data: {
          type: "stage_change",
          title: body.status === "won" ? "Deal marked as Closed Won" : `Deal marked as ${body.status}`,
          dealId: id,
          leadId: deal.leadId || undefined,
          userId: session.user.id,
          metadata: JSON.stringify({ status: body.status }),
        },
      });
    }

    return NextResponse.json(updated);
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const deal = await prisma.deal.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.deal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

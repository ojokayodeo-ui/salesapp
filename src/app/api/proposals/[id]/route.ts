import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = await req.json();

    const proposal = await prisma.proposal.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });
    if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.proposal.update({
      where: { id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.totalValue !== undefined && { totalValue: body.totalValue }),
        ...(body.status === "sent" && !proposal.sentAt && { sentAt: new Date() }),
        ...(body.status === "viewed" && !proposal.viewedAt && { viewedAt: new Date() }),
        ...(["accepted", "rejected"].includes(body.status) && { respondedAt: new Date() }),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const proposal = await prisma.proposal.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });
    if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.proposal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

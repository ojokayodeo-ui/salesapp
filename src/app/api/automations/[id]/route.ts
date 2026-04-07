import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = await req.json();

    const auto = await prisma.automation.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });
    if (!auto) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.automation.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.trigger !== undefined && { trigger: body.trigger }),
        ...(body.triggerConfig !== undefined && { triggerConfig: JSON.stringify(body.triggerConfig) }),
        ...(body.actions !== undefined && { actions: JSON.stringify(body.actions) }),
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

    await prisma.automation.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });

    await prisma.automation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = await req.json();

    const activity = await prisma.activity.update({
      where: { id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.status === "completed" && { completedAt: new Date() }),
      },
    });

    return NextResponse.json(activity);
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    await prisma.activity.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

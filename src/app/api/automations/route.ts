import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const CreateAutomationSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  trigger: z.enum(["stage_enter", "stage_exit", "time_delay", "no_reply", "deal_created", "deal_won", "deal_lost"]),
  triggerConfig: z.record(z.unknown()).default({}),
  actions: z.array(z.object({ type: z.string(), config: z.record(z.unknown()) })).default([]),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    const session = await requireSession();

    const automations = await prisma.automation.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ automations });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const data = CreateAutomationSchema.parse(body);

    const automation = await prisma.automation.create({
      data: {
        ...data,
        triggerConfig: data.triggerConfig as Prisma.InputJsonValue,
        actions: data.actions as Prisma.InputJsonValue,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json(automation, { status: 201 });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

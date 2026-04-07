import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const CreateProposalSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  dealId: z.string(),
  totalValue: z.number().min(0).default(0),
  validUntil: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const dealId = searchParams.get("dealId") || "";

    const proposals = await prisma.proposal.findMany({
      where: {
        organizationId: session.user.organizationId,
        ...(dealId && { dealId }),
      },
      orderBy: { createdAt: "desc" },
      include: { deal: { select: { id: true, title: true } } },
    });

    return NextResponse.json({ proposals });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const data = CreateProposalSchema.parse(body);

    const proposal = await prisma.proposal.create({
      data: {
        ...data,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json(proposal, { status: 201 });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession();

    // Only owners/admins can update org
    if (!["owner", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = UpdateSchema.parse(body);

    const updated = await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: {
        ...(data.name && { name: data.name }),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

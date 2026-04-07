import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const CreateLeadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional(),
  website: z.string().optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  source: z.enum(["cold", "inbound", "referral", "form", "csv", "manual"]).default("manual"),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  linkedinUrl: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const source = searchParams.get("source") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where = {
      organizationId: session.user.organizationId,
      ...(search && {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
          { company: { contains: search } },
        ],
      }),
      ...(source && { source }),
      ...(status && { status }),
    };

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { deals: true, activities: true } },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return NextResponse.json({ leads, total, page, limit });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();

    // Handle bulk import
    if (Array.isArray(body)) {
      const results = [];
      for (const item of body) {
        try {
          const data = CreateLeadSchema.parse(item);
          const lead = await prisma.lead.create({
            data: {
              ...data,
              organizationId: session.user.organizationId,
            },
          });
          results.push({ success: true, lead });
        } catch {
          results.push({ success: false, error: "Validation failed", data: item });
        }
      }
      return NextResponse.json({ results });
    }

    const data = CreateLeadSchema.parse(body);
    const lead = await prisma.lead.create({
      data: {
        ...data,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 422 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

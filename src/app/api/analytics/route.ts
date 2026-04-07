import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const orgId = session.user.organizationId;
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "30"; // days

    const since = new Date();
    since.setDate(since.getDate() - parseInt(period));

    // Aggregate deal stats
    const [allDeals, wonDeals, lostDeals, openDeals] = await Promise.all([
      prisma.deal.findMany({
        where: { organizationId: orgId },
        select: { id: true, value: true, status: true, probability: true, stageId: true, createdAt: true },
      }),
      prisma.deal.findMany({
        where: { organizationId: orgId, status: "won" },
        select: { value: true, createdAt: true, ownerId: true },
      }),
      prisma.deal.findMany({
        where: { organizationId: orgId, status: "lost" },
        select: { value: true, createdAt: true },
      }),
      prisma.deal.findMany({
        where: { organizationId: orgId, status: "open" },
        select: { value: true, probability: true, stageId: true },
      }),
    ]);

    const totalPipelineValue = openDeals.reduce((s, d) => s + d.value, 0);
    const weightedPipeline = openDeals.reduce((s, d) => s + d.value * (d.probability / 100), 0);
    const wonValue = wonDeals.reduce((s, d) => s + d.value, 0);
    const conversionRate = allDeals.length ? (wonDeals.length / allDeals.length) * 100 : 0;
    const avgDealSize = wonDeals.length ? wonValue / wonDeals.length : 0;

    // Funnel by stage
    const pipeline = await prisma.pipeline.findFirst({
      where: { organizationId: orgId, isDefault: true },
      include: {
        stages: {
          orderBy: { order: "asc" },
          include: {
            deals: {
              select: { value: true, status: true },
            },
          },
        },
      },
    });

    const funnelData = pipeline?.stages.map((s) => ({
      name: s.name,
      count: s.deals.length,
      value: s.deals.reduce((sum, d) => sum + d.value, 0),
      color: s.color,
    })) ?? [];

    // Revenue by period (last 6 months)
    const revenueByMonth: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      revenueByMonth[key] = 0;
    }
    for (const deal of wonDeals) {
      const key = new Date(deal.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" });
      if (key in revenueByMonth) revenueByMonth[key] += deal.value;
    }

    // Rep performance
    const users = await prisma.user.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true },
    });

    const repPerformance = await Promise.all(
      users.map(async (u) => {
        const [rWon, rLost, rOpen, rActivities] = await Promise.all([
          prisma.deal.aggregate({ where: { organizationId: orgId, ownerId: u.id, status: "won" }, _count: true, _sum: { value: true } }),
          prisma.deal.count({ where: { organizationId: orgId, ownerId: u.id, status: "lost" } }),
          prisma.deal.count({ where: { organizationId: orgId, ownerId: u.id, status: "open" } }),
          prisma.activity.count({ where: { userId: u.id, createdAt: { gte: since } } }),
        ]);
        return {
          userId: u.id,
          name: u.name,
          dealsWon: rWon._count,
          dealsLost: rLost,
          dealsOpen: rOpen,
          wonValue: rWon._sum.value ?? 0,
          activities: rActivities,
        };
      })
    );

    // Recent activities
    const recentActivities = await prisma.activity.findMany({
      where: {
        OR: [
          { deal: { organizationId: orgId } },
          { lead: { organizationId: orgId } },
          { userId: { in: users.map((u) => u.id) } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
        lead: { select: { id: true, name: true, company: true } },
      },
    });

    return NextResponse.json({
      overview: {
        totalDeals: allDeals.length,
        openDeals: openDeals.length,
        wonDeals: wonDeals.length,
        lostDeals: lostDeals.length,
        totalPipelineValue,
        weightedPipeline,
        wonValue,
        conversionRate: Math.round(conversionRate * 10) / 10,
        avgDealSize: Math.round(avgDealSize),
      },
      funnelData,
      revenueByMonth: Object.entries(revenueByMonth).map(([month, value]) => ({ month, value })),
      repPerformance,
      recentActivities,
    });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Automation Execution Engine
 *
 * Run this on a schedule (e.g. every 15 minutes via cron or Vercel Cron Jobs).
 * Call: POST /api/cron/automations
 * Header: Authorization: Bearer <CRON_SECRET>
 *
 * What it does:
 * 1. Find all pending DealAutomations where scheduledAt <= now
 * 2. Execute each action (create_task, notify_rep, move_stage, etc.)
 * 3. Mark as completed or failed
 *
 * Also checks all open deals for time_delay / no_activity triggers
 * and schedules new DealAutomations as needed.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const CRON_SECRET = process.env.CRON_SECRET || "cron-secret-change-me";

export async function POST(req: NextRequest) {
  // Simple shared-secret auth for cron callers
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results = { executed: 0, scheduled: 0, errors: 0 };

  // ── 1. Execute pending DealAutomations ─────────────────────────────────────
  const pending = await prisma.dealAutomation.findMany({
    where: { status: "pending", scheduledAt: { lte: now } },
    include: {
      deal: { include: { owner: true, lead: true, stage: true } },
      automation: true,
    },
    take: 50,
  });

  for (const da of pending) {
    try {
      const actions: { type: string; config: Record<string, unknown> }[] =
        JSON.parse(da.automation.actions);

      for (const action of actions) {
        await executeAction(action, da.deal);
      }

      await prisma.dealAutomation.update({
        where: { id: da.id },
        data: { status: "completed", executedAt: now },
      });

      await prisma.automation.update({
        where: { id: da.automationId },
        data: { executionCount: { increment: 1 } },
      });

      results.executed++;
    } catch (err) {
      console.error(`DealAutomation ${da.id} failed:`, err);
      await prisma.dealAutomation.update({
        where: { id: da.id },
        data: { status: "failed", result: String(err) },
      });
      results.errors++;
    }
  }

  // ── 2. Schedule new automations for time_delay / no_activity triggers ──────
  const timeDelayAutomations = await prisma.automation.findMany({
    where: { trigger: "time_delay", isActive: true },
  });

  if (timeDelayAutomations.length > 0) {
    const openDeals = await prisma.deal.findMany({
      where: { status: "open" },
      include: {
        activities: { orderBy: { createdAt: "desc" }, take: 1 },
        dealAutomations: { where: { status: { in: ["pending", "completed"] } } },
      },
    });

    for (const deal of openDeals) {
      for (const auto of timeDelayAutomations) {
        const config: Record<string, unknown> = JSON.parse(auto.triggerConfig);
        const delayDays = (config.delayDays as number) ?? 3;

        // Check if already scheduled for this deal+automation
        const alreadyScheduled = deal.dealAutomations.some(
          (da) => da.automationId === auto.id
        );
        if (alreadyScheduled) continue;

        // Check last activity date
        const lastActivity = deal.activities[0]?.createdAt ?? deal.createdAt;
        const daysSince = (now.getTime() - new Date(lastActivity).getTime()) / 86400000;

        if (daysSince >= delayDays) {
          await prisma.dealAutomation.create({
            data: {
              dealId: deal.id,
              automationId: auto.id,
              status: "pending",
              scheduledAt: now, // execute on next cron run
            },
          });
          results.scheduled++;
        }
      }
    }
  }

  return NextResponse.json({ ...results, timestamp: now.toISOString() });
}

// ── Action executor ────────────────────────────────────────────────────────────
async function executeAction(
  action: { type: string; config: Record<string, unknown> },
  deal: {
    id: string;
    title: string;
    ownerId?: string | null;
    leadId?: string | null;
    stageId: string;
    owner?: { id: string } | null;
  }
) {
  switch (action.type) {
    case "create_task": {
      const dueInDays = (action.config.dueInDays as number) ?? 1;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + dueInDays);
      await prisma.activity.create({
        data: {
          type: "task",
          title: (action.config.title as string) || "Follow up",
          status: "pending",
          dueDate,
          dealId: deal.id,
          leadId: deal.leadId ?? undefined,
          userId: deal.ownerId ?? deal.owner?.id ?? "system",
          metadata: JSON.stringify({ automationCreated: true }),
        },
      });
      break;
    }

    case "move_stage": {
      const targetStageId = action.config.stageId as string;
      if (targetStageId) {
        await prisma.deal.update({
          where: { id: deal.id },
          data: { stageId: targetStageId },
        });
      }
      break;
    }

    case "notify_rep":
    case "notify_team": {
      // In a real app: send email/Slack via integration
      // For now: create a note activity as an in-app notification
      await prisma.activity.create({
        data: {
          type: "note",
          title: `[Automation] ${action.config.message as string || "Automation triggered"}`,
          status: "pending",
          dealId: deal.id,
          userId: deal.ownerId ?? deal.owner?.id ?? "system",
          metadata: JSON.stringify({ automationNotification: true }),
        },
      });
      break;
    }

    default:
      console.warn(`Unknown automation action type: ${action.type}`);
  }
}

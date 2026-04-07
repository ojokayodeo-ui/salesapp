import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const lead = await prisma.lead.findFirst({
      where: { id, organizationId: session.user.organizationId },
      include: {
        deals: { include: { stage: true } },
        activities: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });

    if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const prompt = `You are a lead scoring AI. Score this B2B sales lead from 0 to 100.

Lead Profile:
- Name: ${lead.name}
- Company: ${lead.company || "Unknown"}
- Title: ${lead.title || "Unknown"}
- Source: ${lead.source}
- Current Status: ${lead.status}
- Tags: ${lead.tags}
- Website: ${lead.website || "none"}
- Active Deals: ${lead.deals.length} (stages: ${lead.deals.map((d) => d.stage.name).join(", ") || "none"})
- Recent Activities: ${lead.activities.map((a) => a.type + ": " + a.title).join("; ") || "none"}

Scoring criteria (weight each):
- Company fit / ICP match (30%) — inferred from tags, company name, title
- Engagement level (25%) — number of activities, deal stages reached
- Source quality (20%) — referral > inbound > form > cold > manual
- Deal momentum (25%) — active deals, how far in pipeline

Return ONLY a JSON object with this exact shape:
{"score": <integer 0-100>, "reason": "<one sentence explanation>"}`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "{}");
    const score = Math.min(100, Math.max(0, parseInt(json.score) || lead.score));

    const updated = await prisma.lead.update({
      where: { id },
      data: { score },
    });

    return NextResponse.json({ score: updated.score, reason: json.reason || "" });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Lead score error:", err);
    return NextResponse.json({ error: "Scoring failed" }, { status: 500 });
  }
}

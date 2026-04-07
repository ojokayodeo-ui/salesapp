import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { dealId, leadId, analysisType } = await req.json();

    let contextData = "";

    if (dealId) {
      const deal = await prisma.deal.findFirst({
        where: { id: dealId, organizationId: session.user.organizationId },
        include: {
          stage: true,
          lead: true,
          activities: { orderBy: { createdAt: "desc" }, take: 10 },
        },
      });

      if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

      const daysSinceActivity = deal.activities.length
        ? Math.floor((Date.now() - new Date(deal.activities[0].createdAt).getTime()) / 86400000)
        : 999;

      contextData = `
Deal: ${deal.title}
Stage: ${deal.stage.name}
Value: $${deal.value}
Probability: ${deal.probability}%
Priority: ${deal.priority}
Expected Close: ${deal.expectedCloseDate || "Not set"}
Days since last activity: ${daysSinceActivity}
Recent activities: ${deal.activities.slice(0, 3).map((a) => `${a.type}: ${a.title}`).join(", ")}
Lead: ${deal.lead?.name || "Unknown"} at ${deal.lead?.company || "Unknown"}
Lead Score: ${deal.lead?.score || 0}/100
Notes: ${deal.notes || "None"}
      `;
    } else if (leadId) {
      const lead = await prisma.lead.findFirst({
        where: { id: leadId, organizationId: session.user.organizationId },
        include: { deals: { include: { stage: true } } },
      });

      if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

      contextData = `
Lead: ${lead.name}
Company: ${lead.company || "Unknown"}
Title: ${lead.title || "Unknown"}
Source: ${lead.source}
Status: ${lead.status}
Score: ${lead.score}/100
Tags: ${lead.tags}
Active Deals: ${lead.deals.map((d) => `${d.title} (${d.stage.name})`).join(", ") || "None"}
      `;
    }

    let prompt = "";

    switch (analysisType) {
      case "deal_health":
        prompt = `
You are a sales intelligence AI. Analyze this deal and provide a concise health assessment.

${contextData}

Provide:
1. Health Score (0-100) with emoji indicator (🔴🟡🟢)
2. Top 3 risks or red flags
3. Top 2 opportunities or positive signals
4. Recommended next action (specific, actionable, within 24 hours)
5. Predicted outcome if no action taken

Be concise. Use bullet points. Sales reps are busy.
`;
        break;

      case "hot_leads":
        prompt = `
You are a sales AI. Evaluate this lead's buying intent and urgency.

${contextData}

Rate:
1. Hot Lead Score (0-100) — likelihood to buy in next 30 days
2. Intent Signals detected (list them)
3. Ideal outreach timing (today, this week, next week)
4. Best opening line for next touchpoint
5. One critical insight the rep should know

Be direct and specific.
`;
        break;

      case "at_risk":
        prompt = `
You are a deal risk analyst. Identify risk factors for this deal.

${contextData}

Analyze:
1. Risk Level: Low / Medium / High / Critical
2. Top 3 specific risk factors (with reasoning)
3. Warning signs present in the data
4. Recovery actions ranked by impact
5. Probability adjustment recommendation (current: ${contextData.match(/Probability: (\d+)/)?.[1] || "unknown"}%)

Be analytical and specific.
`;
        break;

      default:
        prompt = `
You are a sales AI assistant. Provide insights for this context.

${contextData}

Give 3-5 actionable insights to help close or advance this deal/lead. Be specific and practical.
`;
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") return NextResponse.json({ error: "Unexpected response" }, { status: 500 });

    return NextResponse.json({ analysis: content.text, analysisType });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("AI analyze error:", err);
    return NextResponse.json({ error: "AI analysis failed" }, { status: 500 });
  }
}

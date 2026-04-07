import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TEMPLATES: Record<string, (ctx: Record<string, string>) => string> = {
  cold_email: (ctx) => `
You are an expert B2B sales copywriter. Write a compelling cold email for the following prospect.

Prospect Details:
- Name: ${ctx.name || "the prospect"}
- Company: ${ctx.company || "their company"}
- Title: ${ctx.title || "decision maker"}
- Industry/Tags: ${ctx.tags || "B2B"}
- Website: ${ctx.website || ""}

Sender Details:
- Sender Name: ${ctx.senderName || "Sales Rep"}
- Product/Service: ${ctx.product || "a B2B SaaS solution"}

Instructions:
- Keep it under 150 words
- Lead with a personalized opener referencing their company or role
- One clear value proposition
- One soft CTA (15-minute call)
- No buzzwords, no fluff
- Sound human, not robotic

Output format: Subject line first, then the email body.
`,

  follow_up: (ctx) => `
You are a sales expert. Write a follow-up email for a prospect who hasn't replied.

Context:
- Prospect Name: ${ctx.name || "the prospect"}
- Company: ${ctx.company || "their company"}
- Days since last contact: ${ctx.daysSince || "5"}
- Previous message context: ${ctx.previousContext || "initial cold outreach"}
- Deal Stage: ${ctx.stage || "Contacted"}

Instructions:
- Reference the previous touchpoint naturally
- Add new value (insight, case study reference, or relevant question)
- Keep it under 100 words
- End with a clear, easy-to-say-yes CTA
- Warm but professional tone

Output format: Subject line first, then email body.
`,

  sales_script: (ctx) => `
You are a sales coach. Create a concise sales call script for this prospect.

Deal Context:
- Prospect: ${ctx.name || "Prospect"} at ${ctx.company || "Company"}
- Deal Stage: ${ctx.stage || "Qualified"}
- Deal Value: ${ctx.value || "TBD"}
- Known Pain Points: ${ctx.painPoints || "efficiency and growth"}

Structure the script with:
1. Opening (10 seconds) — build rapport
2. Discovery Questions (3 key questions)
3. Value Proposition (30 seconds tailored to their pain)
4. Handling Objections (2-3 common objections with responses)
5. Close (specific ask)

Keep it conversational and practical.
`,

  proposal_outline: (ctx) => `
You are a senior consultant. Create a professional proposal outline for this deal.

Deal Details:
- Client: ${ctx.company || "Client"}
- Contact: ${ctx.name || "Contact"}
- Solution: ${ctx.product || "B2B SaaS"}
- Deal Value: ${ctx.value || "TBD"}
- Key Pain Points: ${ctx.painPoints || "operational efficiency"}
- Deal Stage: ${ctx.stage || "Proposal"}

Create a structured proposal outline with:
1. Executive Summary
2. Problem Statement (their specific challenge)
3. Proposed Solution (tailored to their needs)
4. Scope of Work / Deliverables
5. Investment & ROI Projection
6. Timeline
7. Next Steps

Format as a clean, professional outline.
`,

  outreach_angle: (ctx) => `
You are a sales strategist. Analyze this lead and suggest the best outreach angles.

Lead Profile:
- Name: ${ctx.name}
- Company: ${ctx.company}
- Title: ${ctx.title || "Unknown"}
- Source: ${ctx.source || "cold"}
- Tags: ${ctx.tags || "B2B"}
- Website: ${ctx.website || ""}
- Lead Score: ${ctx.score || "N/A"}/100

Provide:
1. Top 3 personalized outreach angles (specific hooks or conversation starters)
2. Best channel recommendation (email/LinkedIn/phone) with reasoning
3. Ideal timing suggestion
4. One risk or red flag to watch for
5. Suggested subject line for first email

Be specific and actionable. Reference their company/industry.
`,
};

export async function POST(req: NextRequest) {
  try {
    await requireSession();
    const { type, context } = await req.json();

    if (!type || !TEMPLATES[type]) {
      return NextResponse.json({ error: "Invalid generation type" }, { status: 400 });
    }

    const prompt = TEMPLATES[type](context || {});

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Unexpected response type" }, { status: 500 });
    }

    return NextResponse.json({ content: content.text, type, tokensUsed: message.usage.output_tokens });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("AI generate error:", err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}

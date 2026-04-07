import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Revenue OS database...");

  // Organization
  const org = await prisma.organization.upsert({
    where: { slug: "acme-sales" },
    update: {},
    create: {
      name: "Acme Sales Co.",
      slug: "acme-sales",
      plan: "pro",
    },
  });

  // Users
  const password = await bcrypt.hash("password123", 12);
  const owner = await prisma.user.upsert({
    where: { email: "admin@acme.com" },
    update: {},
    create: {
      email: "admin@acme.com",
      password,
      name: "Alex Rivera",
      role: "owner",
      organizationId: org.id,
    },
  });

  const rep1 = await prisma.user.upsert({
    where: { email: "sarah@acme.com" },
    update: {},
    create: {
      email: "sarah@acme.com",
      password,
      name: "Sarah Chen",
      role: "sales_rep",
      organizationId: org.id,
    },
  });

  const rep2 = await prisma.user.upsert({
    where: { email: "marcus@acme.com" },
    update: {},
    create: {
      email: "marcus@acme.com",
      password,
      name: "Marcus Johnson",
      role: "sales_rep",
      organizationId: org.id,
    },
  });

  // Pipeline & stages
  const pipeline = await prisma.pipeline.upsert({
    where: { id: "pipeline-default" },
    update: {},
    create: {
      id: "pipeline-default",
      name: "Main Sales Pipeline",
      isDefault: true,
      organizationId: org.id,
    },
  });

  const stageData = [
    { id: "stage-1", name: "New Lead",       order: 0, color: "#94a3b8" },
    { id: "stage-2", name: "Contacted",      order: 1, color: "#60a5fa" },
    { id: "stage-3", name: "Replied",        order: 2, color: "#a78bfa" },
    { id: "stage-4", name: "Qualified",      order: 3, color: "#34d399" },
    { id: "stage-5", name: "Meeting Booked", order: 4, color: "#fbbf24" },
    { id: "stage-6", name: "Proposal Sent",  order: 5, color: "#f97316" },
    { id: "stage-7", name: "Negotiation",    order: 6, color: "#ef4444" },
    { id: "stage-8", name: "Closed Won",     order: 7, color: "#10b981" },
    { id: "stage-9", name: "Closed Lost",    order: 8, color: "#6b7280" },
  ];

  const stages: Record<string, { id: string }> = {};
  for (const s of stageData) {
    const stage = await prisma.stage.upsert({
      where: { id: s.id },
      update: {},
      create: { ...s, pipelineId: pipeline.id },
    });
    stages[s.name] = stage;
  }

  // Leads
  const leadsData = [
    { name: "Jordan Lee",    email: "jordan@techcorp.io",  company: "TechCorp",    source: "cold",     tags: ["SaaS","B2B"],        score: 82 },
    { name: "Priya Sharma",  email: "priya@growfast.com",  company: "GrowFast",    source: "inbound",  tags: ["Agency","SMB"],       score: 91 },
    { name: "Tom Walters",   email: "tom@boldmedia.net",   company: "Bold Media",  source: "referral", tags: ["Media","ICP"],        score: 76 },
    { name: "Fatima Hassan", email: "fatima@logixco.com",  company: "Logix Co",    source: "form",     tags: ["Logistics","B2B"],    score: 64 },
    { name: "Ethan Brooks",  email: "ethan@scale9.io",     company: "Scale9",      source: "cold",     tags: ["FinTech","SaaS"],     score: 88 },
    { name: "Li Wei",        email: "li@cloudwave.ai",     company: "CloudWave",   source: "inbound",  tags: ["AI","Enterprise"],    score: 95 },
    { name: "Anna Novak",    email: "anna@designhub.co",   company: "DesignHub",   source: "cold",     tags: ["Design","SMB"],       score: 55 },
    { name: "Carlos Mendez", email: "carlos@nexapro.com",  company: "NexaPro",     source: "referral", tags: ["Enterprise","ICP"],   score: 79 },
  ];

  // Clear existing leads for this org to avoid dups on re-seed
  await prisma.lead.deleteMany({ where: { organizationId: org.id } });
  const leads: { id: string }[] = [];
  for (const l of leadsData) {
    const lead = await prisma.lead.create({
      data: { ...l, organizationId: org.id },
    });
    leads.push(lead);
  }

  // Deals
  const dealsData = [
    { title: "TechCorp — Starter Plan",      value: 4800,   stageId: stages["Contacted"].id,      leadIdx: 0, ownerId: rep1.id,  prob: 30, priority: "high" },
    { title: "GrowFast — Agency License",    value: 12000,  stageId: stages["Meeting Booked"].id, leadIdx: 1, ownerId: owner.id, prob: 65, priority: "high" },
    { title: "Bold Media — Pro Bundle",      value: 7200,   stageId: stages["Proposal Sent"].id,  leadIdx: 2, ownerId: rep2.id,  prob: 75, priority: "medium" },
    { title: "Logix Co — SMB Plan",          value: 3600,   stageId: stages["Qualified"].id,      leadIdx: 3, ownerId: rep1.id,  prob: 40, priority: "low" },
    { title: "Scale9 — Growth Package",      value: 18000,  stageId: stages["Negotiation"].id,    leadIdx: 4, ownerId: owner.id, prob: 80, priority: "high" },
    { title: "CloudWave — Enterprise",       value: 48000,  stageId: stages["Proposal Sent"].id,  leadIdx: 5, ownerId: rep2.id,  prob: 70, priority: "high" },
    { title: "DesignHub — Basic",            value: 2400,   stageId: stages["New Lead"].id,       leadIdx: 6, ownerId: rep1.id,  prob: 20, priority: "low" },
    { title: "NexaPro — Custom Plan",        value: 36000,  stageId: stages["Replied"].id,        leadIdx: 7, ownerId: rep2.id,  prob: 45, priority: "medium" },
    { title: "Acme Corp — Renewal",          value: 9600,   stageId: stages["Closed Won"].id,     leadIdx: 0, ownerId: owner.id, prob: 100, priority: "high",   status: "won" },
    { title: "DataFlow Inc — Q1 Promo",      value: 6000,   stageId: stages["Closed Won"].id,     leadIdx: 1, ownerId: rep1.id,  prob: 100, priority: "medium", status: "won" },
    { title: "Spark Analytics — Pilot",      value: 1800,   stageId: stages["Closed Lost"].id,    leadIdx: 2, ownerId: rep2.id,  prob: 0,   priority: "low",    status: "lost", lostReason: "Budget constraints" },
  ];

  // Clear existing deals for this org
  await prisma.deal.deleteMany({ where: { organizationId: org.id } });
  for (const d of dealsData) {
    const closeDate = new Date();
    closeDate.setDate(closeDate.getDate() + Math.floor(Math.random() * 60) + 7);
    await prisma.deal.create({
      data: {
        title: d.title,
        value: d.value,
        stageId: d.stageId,
        leadId: leads[d.leadIdx].id,
        ownerId: d.ownerId,
        organizationId: org.id,
        probability: d.prob,
        priority: d.priority,
        status: d.status ?? "open",
        lostReason: d.lostReason ?? null,
        expectedCloseDate: closeDate,
        notes: "Added via seed data.",
      },
    });
  }

  // Automations
  const automations = [
    {
      name: "Follow-up after no reply (3 days)",
      description: "Automatically create a follow-up task when a deal has had no activity for 3 days.",
      trigger: "time_delay",
      triggerConfig: { delayDays: 3, event: "no_activity" },
      actions: [{ type: "create_task", config: { title: "Follow up with lead", dueInDays: 1 } }],
    },
    {
      name: "Welcome sequence on New Lead",
      description: "Send a welcome email sequence when a deal enters the New Lead stage.",
      trigger: "stage_enter",
      triggerConfig: { stageId: "stage-1" },
      actions: [
        { type: "send_email", config: { templateId: "welcome", delayHours: 0 } },
        { type: "create_task", config: { title: "Research lead's company", dueInDays: 1 } },
      ],
    },
    {
      name: "Proposal reminder",
      description: "Remind sales rep 2 days before proposal expiry.",
      trigger: "time_delay",
      triggerConfig: { delayDays: -2, event: "proposal_expiry" },
      actions: [{ type: "notify_rep", config: { message: "Proposal expiring soon! Follow up now." } }],
    },
    {
      name: "Win celebration & invoice",
      description: "Trigger invoice creation and notify team when deal is Closed Won.",
      trigger: "deal_won",
      triggerConfig: {},
      actions: [
        { type: "notify_team", config: { message: "Deal closed!" } },
        { type: "create_task", config: { title: "Send invoice to client", dueInDays: 1 } },
      ],
    },
  ];

  for (const a of automations) {
    await prisma.automation.create({
      data: { ...a, organizationId: org.id },
    });
  }

  console.log("Seed complete!");
  console.log("Login: admin@acme.com / password123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

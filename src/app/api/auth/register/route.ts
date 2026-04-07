import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, orgName } = await req.json();

    if (!name || !email || !password || !orgName) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();
    const hashed = await bcrypt.hash(password, 12);

    const org = await prisma.organization.create({
      data: { name: orgName, slug },
    });

    // Create default pipeline + stages
    const pipeline = await prisma.pipeline.create({
      data: { name: "Main Sales Pipeline", isDefault: true, organizationId: org.id },
    });

    const stageData = [
      { name: "New Lead",       order: 0, color: "#94a3b8" },
      { name: "Contacted",      order: 1, color: "#60a5fa" },
      { name: "Replied",        order: 2, color: "#a78bfa" },
      { name: "Qualified",      order: 3, color: "#34d399" },
      { name: "Meeting Booked", order: 4, color: "#fbbf24" },
      { name: "Proposal Sent",  order: 5, color: "#f97316" },
      { name: "Negotiation",    order: 6, color: "#ef4444" },
      { name: "Closed Won",     order: 7, color: "#10b981" },
      { name: "Closed Lost",    order: 8, color: "#6b7280" },
    ];

    await prisma.stage.createMany({
      data: stageData.map((s) => ({ ...s, pipelineId: pipeline.id })),
    });

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashed,
        role: "owner",
        organizationId: org.id,
      },
    });

    const token = await createToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: "owner",
      organizationId: org.id,
    });

    const response = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./db";
import type { AuthSession } from "@/types";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "revenue-os-secret"
);

export async function createToken(payload: AuthSession["user"]): Promise<string> {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<AuthSession["user"] | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as AuthSession["user"];
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  const user = await verifyToken(token);
  if (!user) return null;
  return { user };
}

export async function requireSession(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function getUserFromDb(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: { organization: true },
  });
}

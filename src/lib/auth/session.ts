import { prisma } from "@/lib/db";
import { addDays, hashToken, randomToken } from "./crypto";
import { readSessionToken } from "./cookies";

export type SessionUser = {
  id: string;
  email: string | null;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = await readSessionToken();
  if (!token) return null;
  const row = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!row || row.expiresAt.getTime() <= Date.now()) {
    if (row) {
      await prisma.session.delete({ where: { id: row.id } }).catch(() => null);
    }
    return null;
  }
  return {
    id: row.user.id,
    email: row.user.email,
    name: row.user.name,
    firstName: row.user.firstName,
    lastName: row.user.lastName,
  };
}

export async function createSession(userId: string) {
  const token = randomToken();
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: addDays(30),
    },
  });
  return token;
}

export async function destroySession(token: string | null) {
  if (!token) return;
  await prisma.session
    .deleteMany({ where: { tokenHash: hashToken(token) } })
    .catch(() => null);
}

export function displayName(user: {
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}) {
  const assembled = [user.lastName, user.firstName].filter(Boolean).join(" ");
  return assembled || user.name || "Организатор";
}

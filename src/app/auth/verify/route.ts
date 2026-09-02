import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/auth/crypto";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/cookies";
import { createSession } from "@/lib/auth/session";

function safeNext(value: string | null) {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/cabinet";
}

function readCookie(request: Request, name: string) {
  const header = request.headers.get("cookie") ?? "";
  return (
    header
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`))
      ?.slice(name.length + 1) ?? null
  );
}

async function sessionUserId(request: Request) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const row = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!row || row.expiresAt.getTime() <= Date.now()) return null;
  return row.userId;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const next = safeNext(url.searchParams.get("next"));

  const fail = (reason: string) => {
    const params = new URLSearchParams({ error: reason });
    return NextResponse.redirect(
      new URL(`/auth/check-email?${params.toString()}`, url.origin),
    );
  };

  const existingUserId = await sessionUserId(request);
  if (existingUserId && !token) {
    return NextResponse.redirect(new URL(next, url.origin));
  }

  if (!token) {
    return fail("Ссылка неполная. Запросите новую.");
  }

  const link = await prisma.magicLink.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { email: true } } },
  });

  if (!link) {
    if (existingUserId) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
    return fail("Ссылка недействительна. Запросите новую.");
  }

  if (link.usedAt) {
    if (existingUserId === link.userId) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
    const params = new URLSearchParams({
      error: "Эта ссылка уже использована. Запросите новую.",
    });
    if (link.user.email) params.set("email", link.user.email);
    return NextResponse.redirect(
      new URL(`/auth/check-email?${params.toString()}`, url.origin),
    );
  }

  if (link.expiresAt.getTime() <= Date.now()) {
    if (existingUserId === link.userId) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
    return fail("Срок ссылки истёк. Запросите новую.");
  }

  await prisma.magicLink.update({
    where: { id: link.id },
    data: { usedAt: new Date() },
  });

  if (link.role === "participant" && link.projectId) {
    const user = await prisma.user.findUnique({ where: { id: link.userId } });
    await prisma.projectMembership.upsert({
      where: {
        userId_projectId: { userId: link.userId, projectId: link.projectId },
      },
      create: {
        userId: link.userId,
        projectId: link.projectId,
        role: "participant",
      },
      update: { role: "participant" },
    });
    await prisma.participant.upsert({
      where: {
        projectId_userId: { projectId: link.projectId, userId: link.userId },
      },
      create: {
        projectId: link.projectId,
        userId: link.userId,
        firstName: user?.firstName,
        lastName: user?.lastName,
        status: "in_progress",
      },
      update: {},
    });
  }

  const sessionToken = await createSession(link.userId);
  const response = NextResponse.redirect(new URL(next, url.origin));
  response.cookies.set(SESSION_COOKIE, sessionToken, sessionCookieOptions());
  return response;
}

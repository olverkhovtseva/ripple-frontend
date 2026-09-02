import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addHours, hashToken, randomToken } from "@/lib/auth/crypto";
import { cabinetVerifyUrl, verifyUrl } from "@/lib/auth/appOrigin";
import { findPrismaJoinProject } from "@/lib/join/textJoin";
import { sendMagicLinkEmail } from "@/lib/auth/email";
import type { CreateDraft } from "@/lib/cabinet/createDraft";
import { draftDisplayTitle } from "@/lib/cabinet/createDraft";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      firstName?: string;
      lastName?: string;
      email?: string;
      role?: string;
      next?: string;
      context?: "welcome" | "signin";
      projectTitle?: string;
      draft?: CreateDraft;
      termsAccepted?: boolean;
      projectShareSlug?: string;
    };

    const firstName = (body.firstName ?? "").trim();
    const lastName = (body.lastName ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const role = body.role === "participant" ? "participant" : "organizer";
    const projectShareSlug = (body.projectShareSlug ?? "").trim();
    const draft = body.draft ?? null;

    let participantProjectId: string | null = null;
    if (role === "participant") {
      if (!projectShareSlug) {
        return NextResponse.json(
          { error: "Не указан проект для участия" },
          { status: 400 },
        );
      }
      const joinProject = await findPrismaJoinProject(projectShareSlug);
      if (!joinProject) {
        return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
      }
      participantProjectId = joinProject.id;
    }
    const projectTitle =
      (body.projectTitle ?? "").trim() ||
      (draft ? draftDisplayTitle(draft) : "");

    if (!body.termsAccepted) {
      return NextResponse.json(
        {
          error:
            "Необходимо принять пользовательское соглашение и политику обработки персональных данных",
        },
        { status: 400 },
      );
    }

    if (!lastName || !firstName) {
      return NextResponse.json(
        { error: "Укажите фамилию и имя" },
        { status: 400 },
      );
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Укажите корректный email" },
        { status: 400 },
      );
    }

    const fullName = `${lastName} ${firstName}`.trim();
    const termsAcceptedAt = new Date();

    const user = await prisma.user.upsert({
      where: { email },
      create: { email, firstName, lastName, name: fullName },
      update: { firstName, lastName, name: fullName },
    });

    await prisma.magicLink.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = randomToken();
    const magicLink = await prisma.magicLink.create({
      data: {
        userId: user.id,
        role,
        projectId: participantProjectId,
        tokenHash: hashToken(token),
        deviceNonceHash: hashToken(randomToken()),
        expiresAt: addHours(24),
      },
    });

    if (role === "organizer" || draft) {
      await prisma.organizerRegistration.create({
        data: {
          userId: user.id,
          magicLinkId: magicLink.id,
          firstName,
          lastName,
          projectTitle: projectTitle || null,
          role,
          termsAcceptedAt,
          draftJson: draft ? JSON.stringify(draft) : null,
        },
      });
    }

    const nextPath =
      role === "participant" && projectShareSlug
        ? `/join/${projectShareSlug}`
        : "/cabinet";
    const linkUrl =
      role === "participant"
        ? verifyUrl(token, nextPath, request)
        : cabinetVerifyUrl(token, request);

    if (
      process.env.NODE_ENV === "production" &&
      !process.env.NEXT_PUBLIC_APP_URL
    ) {
      console.warn(
        "[magic-link] NEXT_PUBLIC_APP_URL не задан — в письме может быть неверный домен ссылки",
      );
    }

    const context =
      body.context === "welcome" || Boolean(draft)
        ? "welcome"
        : "signin";

    const mail = await sendMagicLinkEmail({
      to: email,
      firstName,
      url: linkUrl,
      context,
      role,
    });

    return NextResponse.json({
      ok: true,
      email,
      sent: mail.sent,
      ...(process.env.NODE_ENV !== "production" ? { devLink: linkUrl } : {}),
    });
  } catch (error) {
    console.error(error);
    const detail =
      process.env.NODE_ENV !== "production" && error instanceof Error
        ? error.message
        : undefined;
    return NextResponse.json(
      {
        error: detail
          ? `Не удалось отправить ссылку: ${detail}`
          : "Не удалось отправить ссылку",
      },
      { status: 500 },
    );
  }
}

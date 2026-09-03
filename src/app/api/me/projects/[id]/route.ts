import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { appOrigin } from "@/lib/auth/appOrigin";
import { projectStatusLabel } from "@/lib/projects/constants";

type Ctx = { params: Promise<{ id: string }> };

async function loadProject(id: string, userId: string) {
  const membership = await prisma.projectMembership.findFirst({
    where: { projectId: id, userId, role: "organizer" },
    include: {
      project: {
        include: {
          questions: { orderBy: { orderIndex: "asc" } },
          participants: {
            include: { textAnswers: true, photos: true },
            orderBy: { updatedAt: "desc" },
          },
        },
      },
    },
  });
  return membership?.project ?? null;
}

export async function GET(_request: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Нужна авторизация" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const project = await loadProject(id, user.id);
  if (!project) {
    return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
  }

  const origin = appOrigin(_request);
  const daysLeft = Math.max(
    0,
    Math.ceil((project.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );
  const submitted = project.participants.filter((p) => p.status === "submitted");

  return NextResponse.json({
    project: {
      id: project.id,
      title: project.title,
      heroName: project.heroName,
      status: project.status,
      statusLabel: projectStatusLabel(project.status),
      productType: project.productType,
      daysLeft,
      shareSlug: project.shareSlug,
      shareUrl: `${origin}/join/${project.shareSlug}`,
      inviteMessage: project.inviteMessage ?? "",
      questions: project.questions.map((q) => ({
        id: q.id,
        text: q.questionText,
        hint: q.hintText,
      })),
      responseCount: submitted.length,
      participants: project.participants.map((p) => ({
        id: p.id,
        name: [p.firstName, p.lastName].filter(Boolean).join(" ") || "Участник",
        status: p.status,
        answeredCount: p.textAnswers.length,
        photoCount: p.photos.length,
        updatedAt: p.updatedAt.toISOString(),
      })),
    },
  });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Нужна авторизация" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const project = await loadProject(id, user.id);
  if (!project) {
    return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
  }

  const body = (await request.json()) as { inviteMessage?: string };
  if (typeof body.inviteMessage === "string") {
    await prisma.project.update({
      where: { id: project.id },
      data: { inviteMessage: body.inviteMessage },
    });
  }

  return GET(request, ctx);
}

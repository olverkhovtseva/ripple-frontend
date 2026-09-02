import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import {
  VIDEO_SCENARIO_PROMPTS,
  createShareSlug,
  fillVideoPrompt,
  fillVideoQuestion,
  isDeadlineNotBeforeToday,
} from "@/lib/video/questions";
import { defaultInviteMessage } from "@/lib/cabinet/questions";
import { getSessionUser } from "@/lib/auth/session";

type PromptInput = { question?: string; hint?: string };

function normalizePrompts(
  selected: PromptInput[],
  custom: PromptInput[],
  legacyQuestions: string[],
  heroName: string,
) {
  const fromSelected = selected
    .map((p) => ({
      question: (p.question ?? "").trim(),
      hint: (p.hint ?? "").trim(),
    }))
    .filter((p) => p.question)
    .map((p) => fillVideoPrompt(p, heroName));

  const fromCustom = custom
    .map((p) => ({
      question: (p.question ?? "").trim(),
      hint: (p.hint ?? "").trim(),
    }))
    .filter((p) => p.question)
    .map((p) => ({
      question: fillVideoQuestion(
        p.question.startsWith("Расскажите")
          ? p.question
          : `Расскажите ${p.question}`,
        heroName,
      ),
      hint: p.hint ? fillVideoQuestion(p.hint, heroName) : "",
    }));

  if (fromSelected.length || fromCustom.length) {
    return [...fromSelected, ...fromCustom];
  }

  // backward compat: selected_questions as string[]
  return legacyQuestions
    .map((q) => q.trim())
    .filter(Boolean)
    .map((question) => ({
      question: fillVideoQuestion(question, heroName),
      hint: "",
    }));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title?: string;
      hero_name?: string;
      heroName?: string;
      deadline?: string;
      video_format?: string;
      videoFormat?: string;
      selected_prompts?: PromptInput[];
      custom_prompts?: PromptInput[];
      selected_questions?: string[];
      selectedQuestions?: string[];
      custom_questions?: string[];
      organizerId?: string;
      organizer_name?: string;
      organizerName?: string;
      organizer_phone?: string;
      organizerPhone?: string;
    };

    const title = (body.title ?? "").trim();
    const heroName = (body.hero_name ?? body.heroName ?? "").trim();
    const deadlineRaw = (body.deadline ?? "").trim();
    const videoFormatRaw = (body.video_format ?? body.videoFormat ?? "vertical")
      .trim()
      .toLowerCase();
    const videoFormat =
      videoFormatRaw === "horizontal" ? "horizontal" : "vertical";

    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: "Войдите как организатор" },
        { status: 401 },
      );
    }

    if (!title) {
      return NextResponse.json({ error: "Укажите название события" }, { status: 400 });
    }
    if (!heroName) {
      return NextResponse.json(
        { error: "Укажите имя героя торжества" },
        { status: 400 },
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(deadlineRaw)) {
      return NextResponse.json({ error: "Укажите корректный дедлайн" }, { status: 400 });
    }
    if (!isDeadlineNotBeforeToday(deadlineRaw)) {
      return NextResponse.json(
        { error: "Дедлайн не может быть раньше сегодняшнего дня" },
        { status: 400 },
      );
    }
    const [year, month, day] = deadlineRaw.split("-").map(Number);
    const deadline = new Date(year, month - 1, day, 23, 59, 59, 999);
    if (Number.isNaN(deadline.getTime())) {
      return NextResponse.json({ error: "Укажите корректный дедлайн" }, { status: 400 });
    }

    const questions = normalizePrompts(
      body.selected_prompts ?? [],
      body.custom_prompts ??
        (body.custom_questions ?? []).map((q) => ({ question: q })),
      body.selected_questions ?? body.selectedQuestions ?? [],
      heroName,
    );

    if (questions.length < 1) {
      return NextResponse.json(
        { error: "Выберите хотя бы один вопрос" },
        { status: 400 },
      );
    }

    const organizer = await prisma.user.findUniqueOrThrow({
      where: { id: sessionUser.id },
    });
    let shareSlug = createShareSlug();
    for (let i = 0; i < 5; i++) {
      const clash = await prisma.project.findUnique({ where: { shareSlug } });
      if (!clash) break;
      shareSlug = createShareSlug() + randomBytes(1).toString("hex").slice(0, 2);
    }

    const origin = new URL(request.url).origin;
    const shareUrl = `${origin}/v/${shareSlug}`;
    const deadlineYmd = [
      deadline.getFullYear(),
      String(deadline.getMonth() + 1).padStart(2, "0"),
      String(deadline.getDate()).padStart(2, "0"),
    ].join("-");
    const inviteMessage = defaultInviteMessage({
      heroName,
      projectTitle: title,
      deadline: deadlineYmd,
      artifactType: "video",
      shareUrl,
    });

    const project = await prisma.project.create({
      data: {
        organizerId: organizer.id,
        productType: "video",
        title,
        heroName,
        deadline,
        shareSlug,
        status: "active",
        inviteMessage,
        videoFormat,
        questions: {
          create: questions.map((item, index) => ({
            questionText: item.question,
            hintText: item.hint || null,
            orderIndex: index,
          })),
        },
      },
      include: { questions: true },
    });

    await prisma.projectMembership.upsert({
      where: {
        userId_projectId: { userId: organizer.id, projectId: project.id },
      },
      create: { userId: organizer.id, projectId: project.id, role: "organizer" },
      update: { role: "organizer" },
    });

    return NextResponse.json({
      projectId: project.id,
      organizerId: organizer.id,
      phone: organizer.phone,
      shareSlug: project.shareSlug,
      shareUrl: `${origin}/v/${project.shareSlug}`,
      inviteMessage: project.inviteMessage,
      title: project.title,
      heroName: project.heroName,
      deadline: deadlineYmd,
      videoFormat: project.videoFormat,
      templates: VIDEO_SCENARIO_PROMPTS,
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
          ? `Не удалось создать видео-проект: ${detail}`
          : "Не удалось создать видео-проект",
      },
      { status: 500 },
    );
  }
}

import { prisma } from "@/lib/db";
import type { BookCreateDraft, CreateDraft, VideoCreateDraft } from "@/lib/cabinet/createDraft";
import { createTextProject } from "@/lib/projects/createTextProject";
import {
  VIDEO_SCENARIO_PROMPTS,
  createShareSlug,
  fillVideoPrompt,
  fillVideoQuestion,
  isDeadlineNotBeforeToday,
} from "@/lib/video/questions";
import { defaultInviteMessage } from "@/lib/cabinet/questions";
import { randomBytes } from "crypto";

function parseDraft(raw: string | null): CreateDraft | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CreateDraft;
  } catch {
    return null;
  }
}

async function createVideoProject(draft: VideoCreateDraft, userId: string, origin: string) {
  const title = draft.title.trim();
  const heroName = draft.heroName.trim();
  const deadlineRaw = draft.deadline.trim();

  if (!isDeadlineNotBeforeToday(deadlineRaw)) {
    throw new Error("Дедлайн не может быть раньше сегодняшнего дня");
  }

  const [year, month, day] = deadlineRaw.split("-").map(Number);
  const deadline = new Date(year, month - 1, day, 23, 59, 59, 999);

  const selected_prompts = draft.selected
    .slice()
    .sort((a, b) => a - b)
    .map((i) => ({
      question: VIDEO_SCENARIO_PROMPTS[i].question,
      hint: VIDEO_SCENARIO_PROMPTS[i].hint,
    }));

  const custom = draft.customQuestion.trim()
    ? [{ question: draft.customQuestion.trim(), hint: draft.customHint.trim() || undefined }]
    : [];

  const questions = [...selected_prompts, ...custom]
    .map((p) => ({
      question: p.question.trim(),
      hint: (p.hint ?? "").trim(),
    }))
    .filter((p) => p.question)
    .map((p) => ({
      question: fillVideoPrompt(p, heroName).question,
      hint: p.hint ? fillVideoQuestion(p.hint, heroName) : "",
    }));

  let shareSlug = createShareSlug();
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.project.findUnique({ where: { shareSlug } });
    if (!clash) break;
    shareSlug = createShareSlug() + randomBytes(1).toString("hex").slice(0, 2);
  }

  const shareUrl = `${origin}/v/${shareSlug}`;
  const inviteMessage = defaultInviteMessage({
    heroName,
    projectTitle: title,
    deadline: deadlineRaw,
    artifactType: "video",
    shareUrl,
  });

  const project = await prisma.project.create({
    data: {
      organizerId: userId,
      productType: "video",
      title,
      heroName,
      deadline,
      shareSlug,
      status: "in_progress",
      inviteMessage,
      videoFormat: draft.videoFormat,
      questions: {
        create: questions.map((item, index) => ({
          questionText: item.question,
          hintText: item.hint || null,
          orderIndex: index,
        })),
      },
    },
  });

  await prisma.projectMembership.upsert({
    where: {
      userId_projectId: { userId, projectId: project.id },
    },
    create: { userId, projectId: project.id, role: "organizer" },
    update: { role: "organizer" },
  });

  return {
    kind: "video" as const,
    projectId: project.id,
    href: `/cabinet/video/${project.id}`,
    title: project.title,
  };
}

export async function completePendingRegistration(userId: string, origin: string) {
  const registration = await prisma.organizerRegistration.findFirst({
    where: { userId, completedAt: null, draftJson: { not: null } },
    orderBy: { createdAt: "desc" },
  });

  if (!registration) {
    return { completed: false as const };
  }

  const draft = parseDraft(registration.draftJson);
  if (!draft) {
    await prisma.organizerRegistration.update({
      where: { id: registration.id },
      data: { completedAt: new Date() },
    });
    return { completed: false as const };
  }

  if (draft.kind === "book") {
    const project = await createTextProject(draft, userId, origin);
    await prisma.organizerRegistration.update({
      where: { id: registration.id },
      data: { completedAt: new Date() },
    });
    return {
      completed: true as const,
      kind: draft.artifactType as "book" | "presentation",
      projectId: project.id,
      href: `/cabinet/projects/${project.id}`,
      title: project.title,
      heroName: project.heroName,
    };
  }

  const video = await createVideoProject(draft, userId, origin);
  await prisma.organizerRegistration.update({
    where: { id: registration.id },
    data: { completedAt: new Date() },
  });
  return { completed: true as const, ...video };
}

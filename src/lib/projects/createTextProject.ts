import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import {
  buildQuestions,
  defaultInviteMessage,
} from "@/lib/cabinet/questions";
import type { BookCreateDraft } from "@/lib/cabinet/createDraft";
import { createShareSlug } from "@/lib/video/questions";

export async function createTextProject(
  draft: BookCreateDraft,
  userId: string,
  origin: string,
) {
  const heroName = draft.heroName.trim();
  const deadlineRaw = draft.deadline.trim();
  const [year, month, day] = deadlineRaw.split("-").map(Number);
  const deadline = new Date(year, month - 1, day, 23, 59, 59, 999);
  const productType = draft.artifactType;
  const title = draft.projectTitle.trim() || `Книга ${heroName}`;
  const built = buildQuestions(draft.audience, draft.questionIndexes, heroName);

  let shareSlug = createShareSlug();
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.project.findUnique({ where: { shareSlug } });
    if (!clash) break;
    shareSlug = createShareSlug() + randomBytes(1).toString("hex").slice(0, 2);
  }

  const shareUrl = `${origin}/join/${shareSlug}`;
  const inviteMessage = defaultInviteMessage({
    heroName,
    projectTitle: title,
    deadline: deadlineRaw,
    artifactType: productType,
    shareUrl,
  });

  const project = await prisma.project.create({
    data: {
      organizerId: userId,
      productType,
      title,
      heroName,
      deadline,
      shareSlug,
      status: "in_progress",
      inviteMessage,
      questions: {
        create: built.map((q, index) => ({
          questionText: q.text,
          hintText: q.hint || null,
          orderIndex: index,
        })),
      },
    },
    include: { questions: { orderBy: { orderIndex: "asc" } } },
  });

  await prisma.projectMembership.upsert({
    where: {
      userId_projectId: { userId, projectId: project.id },
    },
    create: { userId, projectId: project.id, role: "organizer" },
    update: { role: "organizer" },
  });

  return project;
}

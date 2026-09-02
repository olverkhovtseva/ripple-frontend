import { prisma } from "@/lib/db";

export async function findPrismaJoinProject(shareSlug: string) {
  return prisma.project.findUnique({
    where: { shareSlug },
    include: {
      questions: { orderBy: { orderIndex: "asc" } },
      organizer: { select: { email: true, firstName: true, name: true } },
    },
  });
}

export function joinCollecting(status: string) {
  return status === "collecting" || status === "active";
}

export function joinEditable(deadline: Date) {
  return Date.now() <= deadline.getTime();
}

export async function ensureParticipant(
  projectId: string,
  userId: string,
  firstName: string | null,
  lastName: string | null,
) {
  return prisma.participant.upsert({
    where: { projectId_userId: { projectId, userId } },
    create: {
      projectId,
      userId,
      firstName,
      lastName,
      status: "in_progress",
    },
    update: {},
    include: {
      textAnswers: true,
      photos: { orderBy: { orderIndex: "asc" } },
    },
  });
}

export async function loadParticipantForUser(shareSlug: string, userId: string) {
  const project = await findPrismaJoinProject(shareSlug);
  if (!project) return null;
  const participant = await prisma.participant.findUnique({
    where: { projectId_userId: { projectId: project.id, userId } },
    include: {
      textAnswers: true,
      photos: { orderBy: { orderIndex: "asc" } },
    },
  });
  return { project, participant };
}

export function serializePublicProject(
  project: NonNullable<Awaited<ReturnType<typeof findPrismaJoinProject>>>,
) {
  return {
    id: project.id,
    projectTitle: project.title,
    heroName: project.heroName,
    productType: project.productType,
    deadline: project.deadline.toISOString(),
    daysLeft: Math.max(
      0,
      Math.ceil(
        (project.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      ),
    ),
    questions: project.questions.map((q) => ({
      id: q.id,
      text: q.questionText,
      hint: q.hintText,
    })),
  };
}

export function serializeParticipant(
  participant: Awaited<ReturnType<typeof ensureParticipant>>,
) {
  return {
    id: participant.id,
    status: participant.status,
    firstName: participant.firstName,
    lastName: participant.lastName,
    name: [participant.firstName, participant.lastName]
      .filter(Boolean)
      .join(" "),
    answers: participant.textAnswers.map((a) => ({
      questionId: a.questionId,
      text: a.text,
      savedAt: a.updatedAt.toISOString(),
    })),
    photos: participant.photos.map((p) => ({
      id: p.id,
      fileUrl: p.fileUrl,
      caption: p.caption,
    })),
  };
}

export async function countSubmittedParticipants(projectId: string) {
  return prisma.participant.count({
    where: { projectId, status: "submitted" },
  });
}

export async function notifyOrganizerIfMilestone(
  projectId: string,
  threshold = 5,
) {
  const count = await countSubmittedParticipants(projectId);
  if (count < threshold) return;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { organizer: true },
  });
  if (!project?.organizer.email) return;

  const { sendOrganizerMilestoneEmail } = await import("@/lib/auth/email");
  await sendOrganizerMilestoneEmail({
    to: project.organizer.email,
    firstName: project.organizer.firstName || project.organizer.name || "",
    projectTitle: project.title,
    responseCount: count,
  });
}

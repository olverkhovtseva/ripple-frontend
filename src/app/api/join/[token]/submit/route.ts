import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  joinCollecting,
  joinEditable,
  loadParticipantForUser,
  notifyOrganizerIfMilestone,
  serializeParticipant,
} from "@/lib/join/textJoin";

type Ctx = { params: Promise<{ token: string }> };

export async function POST(_request: Request, context: Ctx) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Нужна авторизация" }, { status: 401 });
  }

  const { token } = await context.params;
  const loaded = await loadParticipantForUser(token, user.id);
  if (!loaded?.project || !loaded.participant) {
    return NextResponse.json({ error: "Участник не найден" }, { status: 404 });
  }
  const { project, participant } = loaded;

  if (!joinCollecting(project.status)) {
    return NextResponse.json({ error: "Сбор закрыт" }, { status: 403 });
  }
  if (!joinEditable(project.deadline)) {
    return NextResponse.json(
      { error: "Срок редактирования истёк" },
      { status: 403 },
    );
  }

  const answered = participant.textAnswers.length;
  if (answered < project.questions.length) {
    return NextResponse.json(
      { error: "Ответьте на все вопросы перед отправкой" },
      { status: 400 },
    );
  }

  const wasSubmitted = participant.status === "submitted";

  const updated = await prisma.participant.update({
    where: { id: participant.id },
    data: { status: "submitted" },
    include: {
      textAnswers: true,
      photos: { orderBy: { orderIndex: "asc" } },
    },
  });

  if (!wasSubmitted) {
    const count = await prisma.participant.count({
      where: { projectId: project.id, status: "submitted" },
    });
    if (count === 5) {
      await notifyOrganizerIfMilestone(project.id, 5);
    }
  }

  return NextResponse.json({ participant: serializeParticipant(updated) });
}

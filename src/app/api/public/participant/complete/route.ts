import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { participantId?: string };
    const participantId = (body.participantId ?? "").trim();
    if (!participantId) {
      return NextResponse.json({ error: "Нет participantId" }, { status: 400 });
    }

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: { answers: true, project: true },
    });

    if (!participant) {
      return NextResponse.json({ error: "Участник не найден" }, { status: 404 });
    }

    if (new Date() > participant.project.deadline) {
      return NextResponse.json({ error: "Дедлайн уже прошёл" }, { status: 403 });
    }

    const updated = await prisma.participant.update({
      where: { id: participantId },
      data: { status: "submitted" },
    });

    return NextResponse.json({
      participantId: updated.id,
      status: updated.status,
      videosCount: participant.answers.length,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Не удалось завершить участие" },
      { status: 500 },
    );
  }
}

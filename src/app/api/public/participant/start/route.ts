import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      share_slug?: string;
      firstName?: string;
      lastName?: string;
      participantId?: string;
    };

    const shareSlug = (body.share_slug ?? "").trim();
    const firstName = (body.firstName ?? "").trim();
    const lastName = (body.lastName ?? "").trim();

    if (!shareSlug) {
      return NextResponse.json({ error: "Нет ссылки проекта" }, { status: 400 });
    }
    if (!firstName) {
      return NextResponse.json({ error: "Укажите имя" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { shareSlug },
      include: { questions: { orderBy: { orderIndex: "asc" } } },
    });

    if (!project || project.status !== "active") {
      return NextResponse.json(
        { error: "Сбор видео недоступен" },
        { status: 403 },
      );
    }

    if (new Date() > project.deadline) {
      return NextResponse.json({ error: "Дедлайн уже прошёл" }, { status: 403 });
    }

    let participant =
      body.participantId
        ? await prisma.participant.findFirst({
            where: { id: body.participantId, projectId: project.id },
            include: { answers: true },
          })
        : null;

    if (participant) {
      participant = await prisma.participant.update({
        where: { id: participant.id },
        data: { firstName, lastName, status: "in_progress" },
        include: { answers: true },
      });
    } else {
      participant = await prisma.participant.create({
        data: {
          projectId: project.id,
          firstName,
          lastName,
          status: "in_progress",
        },
        include: { answers: true },
      });
    }

    return NextResponse.json({
      participantId: participant.id,
      firstName: participant.firstName,
      lastName: participant.lastName,
      status: participant.status,
      answers: participant.answers.map((a) => ({
        id: a.id,
        questionId: a.questionId,
        fileUrl: a.fileUrl,
        fileMimeType: a.fileMimeType,
      })),
      questions: project.questions.map((q) => ({
        id: q.id,
        text: q.questionText,
        hint: q.hintText,
        orderIndex: q.orderIndex,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Не удалось начать запись" },
      { status: 500 },
    );
  }
}

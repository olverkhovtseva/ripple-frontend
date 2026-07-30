import { unlink } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ answerId: string }> };

export async function DELETE(request: Request, context: Ctx) {
  try {
    const { answerId } = await context.params;
    const participantId = new URL(request.url).searchParams.get("participantId");

    const answer = await prisma.mediaAnswer.findUnique({
      where: { id: answerId },
      include: {
        participant: { include: { project: true } },
      },
    });

    if (!answer) {
      return NextResponse.json({ error: "Ответ не найден" }, { status: 404 });
    }
    if (!participantId || answer.participantId !== participantId) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }
    if (new Date() > answer.participant.project.deadline) {
      return NextResponse.json(
        { error: "После дедлайна удалять нельзя" },
        { status: 403 },
      );
    }

    if (answer.fileUrl.startsWith("/uploads/")) {
      const disk = path.join(process.cwd(), "public", answer.fileUrl);
      try {
        await unlink(disk);
      } catch {
        /* file may already be gone */
      }
    }

    await prisma.mediaAnswer.delete({ where: { id: answerId } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Не удалось удалить" }, { status: 500 });
  }
}

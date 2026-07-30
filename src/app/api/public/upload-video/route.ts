import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

const ALLOWED = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
  "video/mpeg",
  "application/octet-stream",
]);

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const participantId = String(form.get("participantId") ?? "").trim();
    const questionId = String(form.get("questionId") ?? "").trim();
    const file = form.get("file");

    if (!participantId || !questionId) {
      return NextResponse.json(
        { error: "Нужны participantId и questionId" },
        { status: 400 },
      );
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
    }

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: { project: true },
    });
    if (!participant) {
      return NextResponse.json({ error: "Участник не найден" }, { status: 404 });
    }
    if (new Date() > participant.project.deadline) {
      return NextResponse.json({ error: "Дедлайн уже прошёл" }, { status: 403 });
    }

    const question = await prisma.projectQuestion.findFirst({
      where: { id: questionId, projectId: participant.projectId },
    });
    if (!question) {
      return NextResponse.json({ error: "Вопрос не найден" }, { status: 404 });
    }

    const mime = file.type || "video/mp4";
    if (mime && !ALLOWED.has(mime) && !mime.startsWith("video/")) {
      return NextResponse.json(
        { error: "Поддерживаются только видеофайлы" },
        { status: 400 },
      );
    }

    const ext =
      path.extname(file.name) ||
      (mime.includes("webm")
        ? ".webm"
        : mime.includes("quicktime") || mime.includes("mov")
          ? ".mov"
          : ".mp4");

    const dir = path.join(process.cwd(), "public", "uploads", "video");
    await mkdir(dir, { recursive: true });
    const filename = `${participantId.slice(0, 8)}-${questionId.slice(0, 8)}-${randomBytes(4).toString("hex")}${ext}`;
    const diskPath = path.join(dir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(diskPath, buffer);

    const fileUrl = `/uploads/video/${filename}`;

    const answer = await prisma.mediaAnswer.upsert({
      where: {
        participantId_questionId: { participantId, questionId },
      },
      create: {
        participantId,
        questionId,
        fileUrl,
        fileMimeType: mime,
      },
      update: {
        fileUrl,
        fileMimeType: mime,
      },
    });

    await prisma.participant.update({
      where: { id: participantId },
      data: { status: "in_progress" },
    });

    return NextResponse.json({
      answerId: answer.id,
      fileUrl: answer.fileUrl,
      fileMimeType: answer.fileMimeType,
      questionId,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Не удалось загрузить видео" },
      { status: 500 },
    );
  }
}

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  joinCollecting,
  joinEditable,
  loadParticipantForUser,
  serializeParticipant,
} from "@/lib/join/textJoin";

type Ctx = { params: Promise<{ token: string }> };

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export async function POST(request: Request, context: Ctx) {
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

  const form = await request.formData();
  const file = form.get("file");
  const caption = String(form.get("caption") ?? "").trim().slice(0, 200);

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  }

  const mime = file.type || "image/jpeg";
  if (!ALLOWED.has(mime) && !mime.startsWith("image/")) {
    return NextResponse.json(
      { error: "Поддерживаются только изображения" },
      { status: 400 },
    );
  }

  const ext =
    path.extname(file.name) ||
    (mime.includes("png") ? ".png" : mime.includes("webp") ? ".webp" : ".jpg");

  const dir = path.join(process.cwd(), "public", "uploads", "photos");
  await mkdir(dir, { recursive: true });
  const filename = `${participant.id.slice(0, 8)}-${randomBytes(4).toString("hex")}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  const count = await prisma.participantPhoto.count({
    where: { participantId: participant.id },
  });

  await prisma.participantPhoto.create({
    data: {
      participantId: participant.id,
      fileUrl: `/uploads/photos/${filename}`,
      caption: caption || null,
      orderIndex: count,
    },
  });

  const updated = await prisma.participant.findUniqueOrThrow({
    where: { id: participant.id },
    include: {
      textAnswers: true,
      photos: { orderBy: { orderIndex: "asc" } },
    },
  });

  return NextResponse.json({ participant: serializeParticipant(updated) });
}

export async function PATCH(request: Request, context: Ctx) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Нужна авторизация" }, { status: 401 });
  }

  const { token } = await context.params;
  const loaded = await loadParticipantForUser(token, user.id);
  if (!loaded?.project || !loaded.participant) {
    return NextResponse.json({ error: "Участник не найден" }, { status: 404 });
  }

  const body = (await request.json()) as { photoId?: string; caption?: string };
  const photoId = (body.photoId ?? "").trim();
  const caption = String(body.caption ?? "").trim().slice(0, 200);

  const photo = await prisma.participantPhoto.findFirst({
    where: { id: photoId, participantId: loaded.participant.id },
  });
  if (!photo) {
    return NextResponse.json({ error: "Фото не найдено" }, { status: 404 });
  }

  await prisma.participantPhoto.update({
    where: { id: photo.id },
    data: { caption: caption || null },
  });

  const updated = await prisma.participant.findUniqueOrThrow({
    where: { id: loaded.participant.id },
    include: {
      textAnswers: true,
      photos: { orderBy: { orderIndex: "asc" } },
    },
  });

  return NextResponse.json({ participant: serializeParticipant(updated) });
}

export async function DELETE(request: Request, context: Ctx) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Нужна авторизация" }, { status: 401 });
  }

  const { token } = await context.params;
  const loaded = await loadParticipantForUser(token, user.id);
  if (!loaded?.participant) {
    return NextResponse.json({ error: "Участник не найден" }, { status: 404 });
  }

  const photoId = new URL(request.url).searchParams.get("photoId")?.trim();
  if (!photoId) {
    return NextResponse.json({ error: "Не указано фото" }, { status: 400 });
  }

  await prisma.participantPhoto.deleteMany({
    where: { id: photoId, participantId: loaded.participant.id },
  });

  const updated = await prisma.participant.findUniqueOrThrow({
    where: { id: loaded.participant.id },
    include: {
      textAnswers: true,
      photos: { orderBy: { orderIndex: "asc" } },
    },
  });

  return NextResponse.json({ participant: serializeParticipant(updated) });
}

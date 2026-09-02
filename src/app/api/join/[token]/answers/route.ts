import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  getProjectByToken,
  upsertParticipant,
} from "@/lib/cabinet/store";
import type { Answer, Participant } from "@/lib/cabinet/types";
import {
  findPrismaJoinProject,
  joinCollecting,
  joinEditable,
  loadParticipantForUser,
  serializeParticipant,
} from "@/lib/join/textJoin";

type Ctx = { params: Promise<{ token: string }> };

const MAX_TEXT = 400;

async function savePrismaAnswer(
  token: string,
  userId: string,
  questionId: string,
  text: string,
) {
  const loaded = await loadParticipantForUser(token, userId);
  if (!loaded?.project || !loaded.participant) {
    return NextResponse.json({ error: "Участник не найден" }, { status: 404 });
  }
  const { project, participant } = loaded;

  if (!joinCollecting(project.status)) {
    return NextResponse.json(
      { error: "Сбор ответов ещё не открыт" },
      { status: 403 },
    );
  }
  if (!joinEditable(project.deadline)) {
    return NextResponse.json(
      { error: "Срок редактирования истёк" },
      { status: 403 },
    );
  }
  if (!project.questions.some((q) => q.id === questionId)) {
    return NextResponse.json({ error: "Вопрос не найден" }, { status: 400 });
  }
  if (!text.trim()) {
    return NextResponse.json(
      { error: "Напишите ответ перед сохранением" },
      { status: 400 },
    );
  }
  if (text.length > MAX_TEXT) {
    return NextResponse.json(
      { error: `Не более ${MAX_TEXT} символов` },
      { status: 400 },
    );
  }

  await prisma.textAnswer.upsert({
    where: {
      participantId_questionId: { participantId: participant.id, questionId },
    },
    create: { participantId: participant.id, questionId, text: text.trim() },
    update: { text: text.trim() },
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

export async function POST(request: Request, context: Ctx) {
  const { token } = await context.params;
  const body = (await request.json()) as {
    participantId?: string;
    name?: string;
    questionId?: string;
    text?: string;
  };

  const prismaProject = await findPrismaJoinProject(token);
  if (prismaProject) {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Нужна авторизация" }, { status: 401 });
    }
    return savePrismaAnswer(
      token,
      user.id,
      (body.questionId ?? "").trim(),
      body.text ?? "",
    );
  }

  const project = await getProjectByToken(token);
  if (!project) {
    return NextResponse.json({ error: "Ссылка недействительна" }, { status: 404 });
  }
  if (project.status !== "collecting") {
    return NextResponse.json(
      { error: "Сбор ответов ещё не открыт" },
      { status: 403 },
    );
  }

  const name = (body.name ?? "").trim();
  const questionId = (body.questionId ?? "").trim();
  const text = (body.text ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "Укажите ваше имя" }, { status: 400 });
  }
  if (!questionId || !project.questions.some((q) => q.id === questionId)) {
    return NextResponse.json({ error: "Вопрос не найден" }, { status: 400 });
  }
  if (!text) {
    return NextResponse.json({ error: "Напишите ответ перед сохранением" }, { status: 400 });
  }

  const now = new Date().toISOString();
  let participant: Participant | undefined = project.participants.find(
    (p) => p.id === body.participantId,
  );

  if (!participant) {
    participant = {
      id: randomUUID(),
      name,
      answers: [],
      createdAt: now,
      updatedAt: now,
    };
  } else {
    participant = { ...participant, name };
  }

  const answer: Answer = {
    questionId,
    text,
    savedAt: now,
  };

  const without = participant.answers.filter((a) => a.questionId !== questionId);
  participant.answers = [...without, answer];
  participant.updatedAt = now;

  const updated = await upsertParticipant(project.id, participant);
  if (!updated) {
    return NextResponse.json({ error: "Не удалось сохранить" }, { status: 500 });
  }

  const saved = updated.participants.find((p) => p.id === participant!.id)!;

  return NextResponse.json({
    participant: {
      id: saved.id,
      name: saved.name,
      answers: saved.answers,
    },
  });
}

export async function GET(request: Request, context: Ctx) {
  const { token } = await context.params;

  const prismaProject = await findPrismaJoinProject(token);
  if (prismaProject) {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ participant: null });
    }
    const loaded = await loadParticipantForUser(token, user.id);
    if (!loaded?.participant) {
      return NextResponse.json({ participant: null });
    }
    return NextResponse.json({
      participant: serializeParticipant(loaded.participant),
    });
  }

  const project = await getProjectByToken(token);
  if (!project) {
    return NextResponse.json({ error: "Ссылка недействительна" }, { status: 404 });
  }

  const participantId = new URL(request.url).searchParams.get("participantId");
  if (!participantId) {
    return NextResponse.json({ participant: null });
  }

  const participant = project.participants.find((p) => p.id === participantId);
  if (!participant) {
    return NextResponse.json({ participant: null });
  }

  return NextResponse.json({
    participant: {
      id: participant.id,
      name: participant.name,
      answers: participant.answers,
    },
  });
}

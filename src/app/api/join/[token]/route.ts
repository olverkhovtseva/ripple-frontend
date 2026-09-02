import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { toPublicProject } from "@/lib/cabinet/serialize";
import { getProjectByToken } from "@/lib/cabinet/store";
import {
  ensureParticipant,
  findPrismaJoinProject,
  joinCollecting,
  joinEditable,
  loadParticipantForUser,
  serializeParticipant,
  serializePublicProject,
} from "@/lib/join/textJoin";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { token } = await context.params;

  const prismaProject = await findPrismaJoinProject(token);
  if (prismaProject) {
    if (!joinCollecting(prismaProject.status)) {
      return NextResponse.json(
        {
          source: "prisma",
          error: "Сбор ещё не запущен организатором",
        },
        { status: 403 },
      );
    }

    const user = await getSessionUser();
    const editable = joinEditable(prismaProject.deadline);
    let participant = null;

    if (user) {
      const row = await loadParticipantForUser(token, user.id);
      if (row?.participant) {
        participant = serializeParticipant(row.participant);
      }
    }

    return NextResponse.json({
      source: "prisma",
      authenticated: Boolean(user),
      editable,
      project: serializePublicProject(prismaProject),
      participant,
    });
  }

  const project = await getProjectByToken(token);
  if (!project) {
    return NextResponse.json({ error: "Ссылка недействительна" }, { status: 404 });
  }
  if (project.status !== "collecting") {
    return NextResponse.json(
      { error: "Сбор ещё не запущен организатором" },
      { status: 403 },
    );
  }

  return NextResponse.json({
    source: "legacy",
    project: toPublicProject(project),
  });
}

export async function POST(_request: Request, context: Ctx) {
  const { token } = await context.params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Нужна авторизация" }, { status: 401 });
  }

  const project = await findPrismaJoinProject(token);
  if (!project) {
    return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
  }
  if (!joinCollecting(project.status)) {
    return NextResponse.json(
      { error: "Сбор ответов ещё не открыт" },
      { status: 403 },
    );
  }

  const participant = await ensureParticipant(
    project.id,
    user.id,
    user.firstName,
    user.lastName,
  );

  return NextResponse.json({
    participant: serializeParticipant(participant),
  });
}

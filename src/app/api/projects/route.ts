import { NextResponse } from "next/server";
import {
  buildQuestions,
  defaultInviteMessage,
} from "@/lib/cabinet/questions";
import { toOrganizerView } from "@/lib/cabinet/serialize";
import { createProject, saveProject } from "@/lib/cabinet/store";
import type { ArtifactType, Audience } from "@/lib/cabinet/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      heroName?: string;
      projectTitle?: string;
      deadline?: string;
      audience?: Audience;
      questionIndexes?: number[];
      artifactType?: ArtifactType;
    };

    const heroName = (body.heroName ?? "").trim();
    const deadline = (body.deadline ?? "").trim();
    const audience = body.audience === "colleague" ? "colleague" : "loved";
    const artifactType: ArtifactType =
      body.artifactType === "video" || body.artifactType === "book"
        ? body.artifactType
        : "presentation";
    const indexes = Array.isArray(body.questionIndexes)
      ? body.questionIndexes.map(Number).filter((n) => Number.isInteger(n))
      : [];

    if (!heroName) {
      return NextResponse.json(
        { error: "Укажите имя героя торжества" },
        { status: 400 },
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
      return NextResponse.json(
        { error: "Укажите дату подготовки подарка" },
        { status: 400 },
      );
    }
    if (indexes.length < 1) {
      return NextResponse.json(
        { error: "Выберите хотя бы один вопрос для сценария" },
        { status: 400 },
      );
    }

    const projectTitle =
      (body.projectTitle ?? "").trim() ||
      (artifactType === "video" ? `Фильм для ${heroName}` : `Книга ${heroName}`);
    const questions = buildQuestions(audience, indexes, heroName);

    const project = await createProject({
      artifactType,
      heroName,
      projectTitle,
      deadline,
      audience,
      questions,
      inviteMessage: "",
      status: "ready",
    });

    const origin = new URL(request.url).origin;
    const shareUrl = `${origin}/join/${project.token}`;
    project.inviteMessage = defaultInviteMessage({
      heroName,
      projectTitle,
      deadline,
      artifactType,
      shareUrl,
    });
    project.updatedAt = new Date().toISOString();
    await saveProject(project);

    return NextResponse.json({ project: toOrganizerView(project) });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Не удалось создать проект" },
      { status: 500 },
    );
  }
}

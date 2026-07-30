import { NextResponse } from "next/server";
import { toOrganizerView, toPublicProject } from "@/lib/cabinet/serialize";
import {
  assertOrganizer,
  getProjectById,
  saveProject,
} from "@/lib/cabinet/store";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Ctx) {
  const { id } = await context.params;
  const project = await getProjectById(id);
  if (!project) {
    return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
  }

  const secret = new URL(request.url).searchParams.get("secret");
  if (assertOrganizer(project, secret)) {
    return NextResponse.json({ project: toOrganizerView(project) });
  }

  return NextResponse.json({ project: toPublicProject(project) });
}

export async function PATCH(request: Request, context: Ctx) {
  const { id } = await context.params;
  const project = await getProjectById(id);
  if (!project) {
    return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
  }

  const body = (await request.json()) as {
    secret?: string;
    inviteMessage?: string;
    status?: "ready" | "collecting";
  };

  if (!assertOrganizer(project, body.secret ?? null)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  if (typeof body.inviteMessage === "string") {
    project.inviteMessage = body.inviteMessage;
  }
  if (body.status === "collecting" || body.status === "ready") {
    project.status = body.status;
  }
  project.updatedAt = new Date().toISOString();
  await saveProject(project);

  return NextResponse.json({ project: toOrganizerView(project) });
}

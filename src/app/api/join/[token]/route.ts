import { NextResponse } from "next/server";
import { toPublicProject } from "@/lib/cabinet/serialize";
import { getProjectByToken } from "@/lib/cabinet/store";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { token } = await context.params;
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

  return NextResponse.json({ project: toPublicProject(project) });
}

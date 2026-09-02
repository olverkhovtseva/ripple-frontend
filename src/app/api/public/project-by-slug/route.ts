import { NextResponse } from "next/server";
import { findPrismaJoinProject, joinCollecting } from "@/lib/join/textJoin";

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ error: "Не указан проект" }, { status: 400 });
  }

  const project = await findPrismaJoinProject(slug);
  if (!project) {
    return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
  }

  return NextResponse.json({
    project: {
      title: project.title,
      heroName: project.heroName,
      collecting: joinCollecting(project.status),
    },
  });
}

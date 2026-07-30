import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatDeadlineRu } from "@/lib/video/questions";

type Ctx = { params: Promise<{ share_slug: string }> };

export async function GET(_request: Request, context: Ctx) {
  try {
    const { share_slug } = await context.params;
    const project = await prisma.project.findUnique({
      where: { shareSlug: share_slug },
      include: {
        questions: { orderBy: { orderIndex: "asc" } },
        organizer: true,
      },
    });

    if (!project || project.status === "archived") {
      return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
    }

    return NextResponse.json({
      logo: "/prive-stories-logo-black.png?v=3",
      title: project.title,
      heroName: project.heroName,
      organizerName: project.organizer.name || "Организатор",
      deadline: project.deadline,
      deadlineLabel: formatDeadlineRu(project.deadline),
      shareSlug: project.shareSlug,
      status: project.status,
      questions: project.questions.map((q) => ({
        id: q.id,
        text: q.questionText,
        hint: q.hintText,
        orderIndex: q.orderIndex,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Ошибка загрузки проекта" }, { status: 500 });
  }
}

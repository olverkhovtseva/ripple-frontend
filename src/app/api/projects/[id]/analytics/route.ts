import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  try {
    const { id } = await context.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { orderIndex: "asc" } },
        participants: {
          include: { answers: true },
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
    }

    const totalQuestions = project.questions.length;
    const inProgress = project.participants.filter(
      (p) => p.status === "in_progress",
    );
    const submitted = project.participants.filter(
      (p) => p.status === "submitted",
    );

    return NextResponse.json({
      project: {
        id: project.id,
        title: project.title,
        heroName: project.heroName,
        deadline: project.deadline,
        shareSlug: project.shareSlug,
        status: project.status,
        productType: project.productType,
      },
      total_invited: project.participants.length,
      in_progress_count: inProgress.length,
      submitted_count: submitted.length,
      participants: project.participants.map((p) => ({
        id: p.id,
        name: [p.firstName, p.lastName].filter(Boolean).join(" ") || "Без имени",
        status: p.status,
        videosCount: p.answers.length,
        totalQuestions,
        updatedAt: p.updatedAt,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Ошибка аналитики" }, { status: 500 });
  }
}

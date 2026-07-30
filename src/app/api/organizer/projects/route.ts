import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const organizerId = new URL(request.url).searchParams.get("organizerId");
    if (!organizerId) {
      return NextResponse.json({ error: "Нужен organizerId" }, { status: 400 });
    }

    const projects = await prisma.project.findMany({
      where: { organizerId, productType: "video" },
      orderBy: { createdAt: "desc" },
      include: {
        questions: true,
        participants: { include: { answers: true } },
      },
    });

    return NextResponse.json({
      projects: projects.map((p) => {
        const submitted = p.participants.filter((x) => x.status === "submitted").length;
        const inProgress = p.participants.filter(
          (x) => x.status === "in_progress",
        ).length;
        const daysLeft = Math.max(
          0,
          Math.ceil((p.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        );
        return {
          id: p.id,
          kind: "video" as const,
          projectTitle: p.title,
          heroName: p.heroName,
          status: p.status,
          shareSlug: p.shareSlug,
          deadline: p.deadline,
          daysLeft,
          responseCount: submitted,
          inProgressCount: inProgress,
          questionsCount: p.questions.length,
          artifactType: "video",
        };
      }),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Ошибка списка проектов" }, { status: 500 });
  }
}

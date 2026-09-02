import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { projectStatusLabel } from "@/lib/projects/createTextProject";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Нужна авторизация" }, { status: 401 });
  }

  const memberships = await prisma.projectMembership.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      project: {
        include: {
          participants: { include: { answers: true } },
        },
      },
    },
  });

  return NextResponse.json({
    projects: memberships.map((item) => {
      const p = item.project;
      const submitted = p.participants.filter((x) => x.status === "submitted").length;
      const inProgress = p.participants.filter((x) => x.status === "in_progress").length;
      const daysLeft = Math.max(
        0,
        Math.ceil((p.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      );
      const kind =
        p.productType === "video"
          ? "video"
          : p.productType === "book"
            ? "book"
            : p.productType === "presentation"
              ? "presentation"
              : "draft";
      const href =
        item.role === "participant"
          ? `/join/${p.shareSlug}`
          : kind === "video"
            ? `/cabinet/video/${p.id}`
            : kind === "draft"
              ? `/#artifacts`
              : `/cabinet/projects/${p.id}`;
      return {
        id: p.id,
        role: item.role,
        kind,
        href,
        projectTitle: p.title,
        heroName: p.heroName,
        status: p.status,
        statusLabel: projectStatusLabel(p.status),
        shareSlug: p.shareSlug,
        daysLeft,
        responseCount: submitted,
        inProgressCount: inProgress,
      };
    }),
  });
}

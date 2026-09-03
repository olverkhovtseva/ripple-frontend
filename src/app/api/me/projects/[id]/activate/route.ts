import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { PROMO_CODE_BUILDER } from "@/lib/projects/constants";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Нужна авторизация" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = (await request.json()) as { promoCode?: string };

  const membership = await prisma.projectMembership.findFirst({
    where: { projectId: id, userId: user.id, role: "organizer" },
    include: { project: true },
  });
  if (!membership) {
    return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
  }

  const project = membership.project;
  if (project.status === "collecting" || project.status === "active") {
    return NextResponse.json({ ok: true, status: project.status });
  }

  const promo = (body.promoCode ?? "").trim().toUpperCase();
  if (promo && promo !== PROMO_CODE_BUILDER) {
    return NextResponse.json({ error: "Промокод не найден" }, { status: 400 });
  }

  // Пока оплата — макет: промокод BUILDER или пустой submit активирует сбор
  await prisma.project.update({
    where: { id: project.id },
    data: { status: "collecting" },
  });

  return NextResponse.json({ ok: true, status: "collecting" });
}

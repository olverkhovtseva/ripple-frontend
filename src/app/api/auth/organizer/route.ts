import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isValidRuPhone, normalizePhone } from "@/lib/cabinet/phone";

/** Лёгкая «авторизация» организатора: имя + телефон без SMS. */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      phone?: string;
    };

    const name = (body.name ?? "").trim();
    const phoneRaw = (body.phone ?? "").trim();

    if (!name) {
      return NextResponse.json({ error: "Укажите имя" }, { status: 400 });
    }
    if (!isValidRuPhone(phoneRaw)) {
      return NextResponse.json(
        { error: "Укажите корректный номер телефона (+7…)" },
        { status: 400 },
      );
    }

    const phone = normalizePhone(phoneRaw);

    const existing = await prisma.user.findUnique({ where: { phone } });
    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: { name },
        })
      : await prisma.user.create({
          data: { name, phone },
        });

    return NextResponse.json({
      organizerId: user.id,
      name: user.name,
      phone: user.phone,
      isNew: !existing,
    });
  } catch (error) {
    console.error(error);
    const detail =
      process.env.NODE_ENV !== "production" && error instanceof Error
        ? error.message
        : undefined;
    return NextResponse.json(
      {
        error: detail
          ? `Не удалось сохранить профиль: ${detail}`
          : "Не удалось сохранить профиль",
      },
      { status: 500 },
    );
  }
}

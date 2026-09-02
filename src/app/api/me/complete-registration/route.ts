import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { completePendingRegistration } from "@/lib/auth/completeRegistration";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  try {
    const origin = new URL(request.url).origin;
    const result = await completePendingRegistration(user.id, origin);
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Не удалось создать проект из черновика" },
      { status: 500 },
    );
  }
}

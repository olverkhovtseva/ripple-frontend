import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/cookies";
import { destroySession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);

  await destroySession(token ? decodeURIComponent(token) : null);

  const origin = new URL(request.url).origin;
  const response = NextResponse.redirect(new URL("/", origin), { status: 303 });
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}

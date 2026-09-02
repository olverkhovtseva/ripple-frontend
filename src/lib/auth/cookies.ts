import { cookies } from "next/headers";

export const SESSION_COOKIE = "prive_session";
export const MAGIC_COOKIE = "prive_magic";

const SESSION_MAX_AGE = 30 * 24 * 60 * 60;
const MAGIC_MAX_AGE = 24 * 60 * 60;

function cookieBase() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  };
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    ...cookieBase(),
    maxAge: SESSION_MAX_AGE,
  });
}

export async function setMagicCookie(nonce: string) {
  const jar = await cookies();
  jar.set(MAGIC_COOKIE, nonce, {
    ...cookieBase(),
    maxAge: MAGIC_MAX_AGE,
  });
}

export async function clearAuthCookies() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(MAGIC_COOKIE);
}

export async function readSessionToken() {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? null;
}

export async function readMagicNonce() {
  const jar = await cookies();
  return jar.get(MAGIC_COOKIE)?.value ?? null;
}

export function sessionCookieOptions() {
  return { ...cookieBase(), maxAge: SESSION_MAX_AGE };
}

export function magicCookieOptions() {
  return { ...cookieBase(), maxAge: MAGIC_MAX_AGE };
}

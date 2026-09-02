import { createHash, randomBytes } from "crypto";

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function randomShareSlug() {
  return randomBytes(6).toString("hex");
}

export function addDays(days: number, from = new Date()) {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

export function addHours(hours: number, from = new Date()) {
  return new Date(from.getTime() + hours * 60 * 60 * 1000);
}

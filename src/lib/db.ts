import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function resolveSqliteUrl(url: string) {
  if (!url.startsWith("file:")) return url;
  const raw = url.slice("file:".length);
  // Absolute path (Unix or Windows drive letter)
  if (path.isAbsolute(raw) || raw.startsWith("/") || /^[A-Za-z]:[\\/]/.test(raw)) {
    return `file:${raw}`;
  }
  return `file:${path.join(process.cwd(), raw)}`;
}

function createPrisma() {
  const url = resolveSqliteUrl(process.env.DATABASE_URL || "file:./dev.db");
  const adapter = new PrismaLibSql({ url });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import fs from "node:fs";
import path from "node:path";

function getDatabaseUrl(): string | undefined {
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      const match = content.match(/^DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  } catch {}
  return process.env.DATABASE_URL;
}

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
  pool?: pg.Pool;
  connString?: string;
};

const currentDbUrl = getDatabaseUrl();

let prisma: PrismaClient;
let pool: pg.Pool;

if (process.env.NODE_ENV === "production") {
  pool = new pg.Pool({ connectionString: currentDbUrl });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  // Recreate pool and client if connection string changed or not yet initialized
  if (!globalForPrisma.prisma || !globalForPrisma.pool || globalForPrisma.connString !== currentDbUrl) {
    if (globalForPrisma.pool) {
      globalForPrisma.pool.end().catch(() => {});
    }
    globalForPrisma.connString = currentDbUrl;
    globalForPrisma.pool = new pg.Pool({ connectionString: currentDbUrl });
    const adapter = new PrismaPg(globalForPrisma.pool);
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  prisma = globalForPrisma.prisma;
  pool = globalForPrisma.pool;
}

export { prisma, pool };

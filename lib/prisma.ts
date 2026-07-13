import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = global as unknown as { prisma?: PrismaClient; pool?: pg.Pool };

let prisma: PrismaClient;
let pool: pg.Pool;

if (process.env.NODE_ENV === "production") {
  pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  if (!globalForPrisma.prisma || !globalForPrisma.pool) {
    globalForPrisma.pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(globalForPrisma.pool);
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  prisma = globalForPrisma.prisma;
  pool = globalForPrisma.pool;
}

export { prisma, pool };

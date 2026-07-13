import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const services = [
    {
      name: "Web Design",
      description: "Custom, responsive website design and development solutions.",
    },
    {
      name: "UI Design",
      description: "User interface and user experience design for web and mobile apps.",
    },
    {
      name: "Graphic Design",
      description: "Branding, logos, marketing materials, and visual design assets.",
    },
  ];

  console.log("Seeding services catalog...");

  for (const service of services) {
    const existing = await prisma.service.findFirst({
      where: { name: service.name },
    });

    if (!existing) {
      await prisma.service.create({
        data: service,
      });
      console.log(`Created service: ${service.name}`);
    } else {
      console.log(`Service already exists: ${service.name}`);
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

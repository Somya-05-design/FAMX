import "dotenv/config";
import { prisma, pool } from "../lib/prisma";

async function main() {
  const users = await prisma.user.findMany();
  console.log("Registered users in public.User table:", JSON.stringify(users, null, 2));

  try {
    const authUsers = await prisma.$queryRaw`SELECT id, email, created_at FROM auth.users`;
    console.log("Registered users in auth.users table:", JSON.stringify(authUsers, null, 2));
  } catch (err: any) {
    console.error("Failed to query auth.users:", err.message);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

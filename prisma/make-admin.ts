import "dotenv/config";
import { prisma, pool } from "../lib/prisma";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Please provide an email. Example: npx tsx prisma/make-admin.ts test@example.com");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`User with email "${email}" not found in database. Make sure they have signed up first!`);
    process.exit(1);
  }

  const updatedUser = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
  });

  console.log(`Successfully set user "${email}" (ID: ${updatedUser.id}) to role: ${updatedUser.role}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

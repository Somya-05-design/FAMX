import { prisma } from "../prisma";

export async function getActiveServices() {
  return await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

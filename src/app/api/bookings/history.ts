import { prisma } from "../../../../lib/db";

export async function getPastCalls(candidateId: string) {
  return prisma.booking.findMany({
    where: {
      candidateId,
      startAt: { lt: new Date() },
    },
    include: {
      professional: { include: { professionalProfile: true } },
    },
    orderBy: { startAt: 'desc' },
  });
}


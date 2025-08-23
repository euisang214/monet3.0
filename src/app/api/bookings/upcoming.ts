import { prisma } from "../../../../lib/db";

export async function getUpcomingCalls(candidateId: string) {
  return prisma.booking.findMany({
    where: {
      candidateId,
      startAt: { gte: new Date() },
    },
    include: {
      professional: { include: { professionalProfile: true } },
    },
    orderBy: { startAt: 'asc' },
  });
}


import { prisma } from "../../../../lib/db";

export async function getPastCalls(candidateId: string) {
  return prisma.booking.findMany({
    where: {
      candidateId,
      startAt: { lt: new Date() },
    },
    include: {
      professional: {
        select: {
          email: true,
          professionalProfile: {
            select: { title: true, employer: true },
          },
        },
      },
    },
    orderBy: { startAt: 'desc' },
  });
}


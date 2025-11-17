import { prisma } from "@/lib/db";

export async function getUpcomingCalls(candidateId: string) {
  return prisma.booking.findMany({
    where: {
      candidateId,
      startAt: { gte: new Date() },
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
    orderBy: { startAt: 'asc' },
  });
}


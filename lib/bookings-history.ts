import { prisma } from "@/lib/db";

export async function getPastCalls(
  candidateId: string,
  page: number,
  perPage: number
) {
  const where = { candidateId, startAt: { lt: new Date() } } as const;
  const [calls, total] = await Promise.all([
    prisma.booking.findMany({
      where,
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
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.booking.count({ where }),
  ]);

  return { calls, totalPages: Math.ceil(total / perPage) };
}


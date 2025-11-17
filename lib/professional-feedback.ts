import { prisma } from "@/lib/db";

export async function getProvidedFeedback(
  userId: string,
  page: number,
  perPage: number
) {
  const where = { professionalId: userId, feedback: { isNot: null } } as const;

  const [feedback, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        candidate: {
          include: {
            candidateProfile: { include: { education: true } },
          },
        },
        feedback: true,
      },
      orderBy: { startAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.booking.count({ where }),
  ]);

  return { feedback, totalPages: Math.ceil(total / perPage) };
}

export async function getPendingFeedback(
  userId: string,
  page: number,
  perPage: number
) {
  const where = {
    professionalId: userId,
    feedback: { is: null },
    status: "completed_pending_feedback",
  } as const;

  const [feedback, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        candidate: {
          include: {
            candidateProfile: { include: { education: true } },
          },
        },
      },
      orderBy: { startAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.booking.count({ where }),
  ]);

  return { feedback, totalPages: Math.ceil(total / perPage) };
}


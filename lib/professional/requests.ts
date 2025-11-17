import { prisma } from "@/lib/core/db";

export async function getProfessionalRequests(
  userId: string,
  page: number,
  perPage: number
) {
  const where = { professionalId: userId, status: "requested" } as const;

  const [requests, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        candidate: {
          include: {
            candidateProfile: {
              include: { education: true },
            },
          },
        },
      },
      orderBy: { startAt: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.booking.count({ where }),
  ]);

  return { requests, totalPages: Math.ceil(total / perPage) };
}


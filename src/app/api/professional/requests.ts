import { prisma } from "../../../../lib/db";

export async function getProfessionalRequests(userId: string) {
  return prisma.booking.findMany({
    where: { professionalId: userId, status: "requested" },
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
  });
}


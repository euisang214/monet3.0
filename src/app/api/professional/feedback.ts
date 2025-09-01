import { prisma } from "../../../../lib/db";

export async function getProvidedFeedback(userId: string) {
  return prisma.booking.findMany({
    where: { professionalId: userId, feedback: { isNot: null } },
    include: {
      candidate: {
        include: {
          candidateProfile: { include: { education: true } },
        },
      },
      feedback: true,
    },
    orderBy: { startAt: "desc" },
  });
}

export async function getPendingFeedback(userId: string) {
  return prisma.booking.findMany({
    where: {
      professionalId: userId,
      feedback: { is: null },
      status: "completed_pending_feedback",
    },
    include: {
      candidate: {
        include: {
          candidateProfile: { include: { education: true } },
        },
      },
    },
    orderBy: { startAt: "desc" },
  });
}


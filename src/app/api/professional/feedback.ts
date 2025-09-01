import { prisma } from "../../../../lib/db";

export async function getProfessionalFeedback(userId: string) {
  return prisma.professionalReview.findMany({
    where: { booking: { professionalId: userId } },
    include: { booking: { include: { candidate: true } } },
    orderBy: { submittedAt: "desc" },
  });
}


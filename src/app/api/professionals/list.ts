import { prisma } from "../../../../lib/db";

export async function listProfessionals() {
  return prisma.user.findMany({
    include: { professionalProfile: true, bookingsAsProfessional: true },
  });
}


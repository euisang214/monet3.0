import { prisma } from "../../../../lib/db";
import { Role } from "@prisma/client";

export async function listUsers(roles: Role[] = [Role.PROFESSIONAL]) {
  return prisma.user.findMany({
    where: { role: { in: roles } },
    include: {
      professionalProfile: true,
      candidateProfile: true,
      bookingsAsProfessional: true,
      bookingsAsCandidate: true,
    },
  });
}

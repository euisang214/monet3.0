import { prisma } from "../../../../lib/db";
import { Role } from "@prisma/client";

export async function listUsers(
  roles: Role[] = [Role.PROFESSIONAL],
  page = 1,
  perPage = 10
) {
  const skip = (page - 1) * perPage;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: roles } },
      include: {
        professionalProfile: true,
        candidateProfile: true,
        bookingsAsProfessional: true,
        bookingsAsCandidate: true,
      },
      skip,
      take: perPage,
    }),
    prisma.user.count({ where: { role: { in: roles } } }),
  ]);

  return {
    users,
    page,
    total,
    totalPages: Math.ceil(total / perPage),
  };
}

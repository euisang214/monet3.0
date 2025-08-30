import { prisma } from "../../../../lib/db";
import { Role } from "@prisma/client";
import {
  ActiveFilters,
  FilterConfig,
  buildFilterWhere,
} from "../filterOptions";

export async function listUsers(
  roles: Role[] = [Role.PROFESSIONAL],
  page = 1,
  perPage = 10,
  filters: ActiveFilters = {},
  filterConfig: FilterConfig = {}
) {
  const skip = (page - 1) * perPage;

  const filterWhere = buildFilterWhere(filterConfig, filters);
  const where = { role: { in: roles }, ...filterWhere };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        professionalProfile: {
          select: {
            userId: true,
            employer: true,
            title: true,
            bio: true,
            priceUSD: true,
            availabilityPrefs: true,
            verifiedAt: true,
            corporateEmail: true,
            experience: true,
            education: true,
            interests: true,
            activities: true,
          },
        },
        candidateProfile: true,
        bookingsAsProfessional: true,
        bookingsAsCandidate: true,
      },
      skip,
      take: perPage,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    page,
    total,
    totalPages: Math.ceil(total / perPage),
  };
}

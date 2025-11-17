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
        professionalProfile: true,
        // Only load upcoming/recent bookings to reduce data transfer and improve performance
        // This provides sufficient data for availability categorization without loading entire history
        bookingsAsProfessional: {
          select: {
            startAt: true,
          },
          where: {
            startAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
          take: 50, // Limit to 50 bookings max per professional
          orderBy: {
            startAt: 'desc',
          },
        },
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

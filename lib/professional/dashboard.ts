import { prisma } from "@/lib/core/db";
import { PaymentStatus } from "@prisma/client";

export async function getProfessionalDashboardData(
  userId: string,
  page: number,
  perPage: number
) {
  const upcomingWhere = { professionalId: userId, startAt: { gte: new Date() } } as const;
  const [
    upcoming,
    upcomingCount,
    acceptedCount,
    requestedCount,
    payments,
    latestReview,
  ] = await Promise.all([
    prisma.booking.findMany({
      where: upcomingWhere,
      include: { candidate: true },
      orderBy: { startAt: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.booking.count({ where: upcomingWhere }),
    prisma.booking.count({
      where: { professionalId: userId, status: "accepted" },
    }),
    prisma.booking.count({
      where: { professionalId: userId, status: "requested" },
    }),
    prisma.payment.findMany({
      where: {
        booking: { professionalId: userId },
        status: PaymentStatus.released,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.professionalReview.findFirst({
      where: { booking: { professionalId: userId } },
      orderBy: { submittedAt: "desc" },
    }),
  ]);

  const totalEarnings = payments.reduce(
    (sum, p) => sum + (p.amountGross - p.platformFee),
    0
  );

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const recentEarnings = payments
    .filter((p) => p.createdAt >= monthStart)
    .reduce((sum, p) => sum + (p.amountGross - p.platformFee), 0);

  const responseRate =
    requestedCount > 0 ? Math.round((acceptedCount / requestedCount) * 100) : 0;

  return {
    upcoming,
    stats: {
      totalEarnings,
      responseRate,
      recentEarnings,
      recentFeedback: latestReview?.text ?? null,
    },
    totalPages: Math.ceil(upcomingCount / perPage),
  };
}


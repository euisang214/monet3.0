import { prisma } from "../../../../lib/db";
import { PaymentStatus } from "@prisma/client";

export async function getProfessionalDashboardData(userId: string) {
  const [upcoming, acceptedCount, requestedCount, payments, latestFeedback] =
    await Promise.all([
      prisma.booking.findMany({
        where: { professionalId: userId, startAt: { gte: new Date() } },
        include: { candidate: true },
        orderBy: { startAt: "asc" },
      }),
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
      prisma.feedback.findFirst({
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
      recentFeedback: latestFeedback?.text ?? null,
    },
  };
}


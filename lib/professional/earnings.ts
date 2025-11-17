import { prisma } from "@/lib/core/db";
import { PaymentStatus } from "@prisma/client";

export async function getProfessionalEarnings(
  userId: string,
  page: number,
  perPage: number
) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const where = { booking: { professionalId: userId } } as const;

  const [payments, totalCount, totalAgg, currentMonthAgg, pendingAgg] =
    await Promise.all([
      prisma.payment.findMany({
        where,
        include: { booking: { include: { candidate: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.payment.count({ where }),
      prisma.payment.aggregate({
        where: { ...where, status: PaymentStatus.released },
        _sum: { amountGross: true, platformFee: true },
      }),
      prisma.payment.aggregate({
        where: {
          ...where,
          status: PaymentStatus.released,
          createdAt: { gte: monthStart },
        },
        _sum: { amountGross: true, platformFee: true },
      }),
      prisma.payment.aggregate({
        where: { ...where, status: PaymentStatus.held },
        _sum: { amountGross: true, platformFee: true },
      }),
    ]);

  const stats = {
    total:
      (totalAgg._sum.amountGross ?? 0) - (totalAgg._sum.platformFee ?? 0),
    currentMonth:
      (currentMonthAgg._sum.amountGross ?? 0) -
      (currentMonthAgg._sum.platformFee ?? 0),
    pending:
      (pendingAgg._sum.amountGross ?? 0) -
      (pendingAgg._sum.platformFee ?? 0),
  };

  return { stats, payments, totalPages: Math.ceil(totalCount / perPage) };
}


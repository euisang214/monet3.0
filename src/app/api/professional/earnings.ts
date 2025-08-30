import { prisma } from "../../../../lib/db";
import { PaymentStatus } from "@prisma/client";

export async function getProfessionalEarnings(userId: string) {
  const payments = await prisma.payment.findMany({
    where: { booking: { professionalId: userId } },
    include: { booking: { include: { candidate: true } } },
    orderBy: { createdAt: "desc" },
  });

  const total = payments
    .filter((p) => p.status === PaymentStatus.released)
    .reduce((sum, p) => sum + (p.amountGross - p.platformFee), 0);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const currentMonth = payments
    .filter(
      (p) => p.status === PaymentStatus.released && p.createdAt >= monthStart
    )
    .reduce((sum, p) => sum + (p.amountGross - p.platformFee), 0);

  const pending = payments
    .filter((p) => p.status === PaymentStatus.held)
    .reduce((sum, p) => sum + (p.amountGross - p.platformFee), 0);

  return { stats: { total, currentMonth, pending }, payments };
}


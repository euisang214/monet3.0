import { prisma } from '@/lib/core/db';
import { Parser } from 'json2csv';

export type ExportType =
  | 'users'
  | 'bookings'
  | 'payments'
  | 'payouts'
  | 'feedback'
  | 'audit-logs';

/**
 * Get export data for a specific entity type
 */
export async function getExportData(type: ExportType): Promise<any[]> {
  switch (type) {
    case 'users':
      return prisma.user.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          timezone: true,
          createdAt: true,
          corporateEmailVerified: true,
          googleCalendarConnected: true,
          linkedinConnected: true,
        },
      });

    case 'bookings':
      return prisma.booking.findMany({
        select: {
          id: true,
          candidateId: true,
          professionalId: true,
          status: true,
          priceUSD: true,
          startAt: true,
          endAt: true,
          timezone: true,
          createdAt: true,
        },
      });

    case 'payments':
      return prisma.payment.findMany({
        select: {
          id: true,
          bookingId: true,
          escrowHoldId: true,
          status: true,
          amountGross: true,
          platformFee: true,
          createdAt: true,
        },
      });

    case 'payouts':
      return prisma.payout.findMany({
        select: {
          id: true,
          bookingId: true,
          proStripeAccountId: true,
          status: true,
          amountNet: true,
          createdAt: true,
        },
      });

    case 'feedback':
      return prisma.feedback.findMany({
        select: {
          bookingId: true,
          text: true,
          actions: true,
          qcStatus: true,
          wordCount: true,
          starsCategory1: true,
          starsCategory2: true,
          starsCategory3: true,
          submittedAt: true,
        },
      });

    case 'audit-logs':
      return prisma.auditLog.findMany({
        select: {
          id: true,
          actorUserId: true,
          action: true,
          entity: true,
          entityId: true,
          createdAt: true,
        },
      });

    default:
      throw new Error(`Unknown export type: ${type}`);
  }
}

/**
 * Convert data to CSV format
 */
export function dataToCSV(data: any[]): string {
  if (data.length === 0) {
    return '';
  }
  const parser = new Parser();
  return parser.parse(data);
}

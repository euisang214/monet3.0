import { prisma } from '@/lib/core/db';
import { Parser } from 'json2csv';

export type ExportType =
  | 'users'
  | 'bookings'
  | 'payments'
  | 'payouts'
  | 'disputes'
  | 'feedback'
  | 'audit-logs'
  | 'invoices';

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
          price: true,
          platformFee: true,
          callDate: true,
          callDuration: true,
          timezone: true,
          createdAt: true,
        },
      });

    case 'payments':
      return prisma.payment.findMany({
        select: {
          id: true,
          bookingId: true,
          stripePaymentIntentId: true,
          status: true,
          amount: true,
          createdAt: true,
        },
      });

    case 'payouts':
      return prisma.payout.findMany({
        select: {
          id: true,
          bookingId: true,
          professionalId: true,
          status: true,
          amount: true,
          createdAt: true,
        },
      });

    case 'disputes':
      return prisma.dispute.findMany({
        select: {
          id: true,
          bookingId: true,
          reason: true,
          status: true,
          createdAt: true,
        },
      });

    case 'feedback':
      return prisma.feedback.findMany({
        select: {
          id: true,
          bookingId: true,
          professionalId: true,
          summary: true,
          qcStatus: true,
          wordCount: true,
          createdAt: true,
        },
      });

    case 'audit-logs':
      return prisma.auditLog.findMany({
        select: {
          id: true,
          userId: true,
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

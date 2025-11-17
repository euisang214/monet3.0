import { describe, expect, it } from 'vitest';
import { recordZoomJoin } from '@/lib/integrations/zoom';
import { BookingStatus } from '@prisma/client';

describe('recordZoomJoin', () => {
  it('sets booking to completed_pending_feedback once both join', async () => {
    const booking = {
      id: 'b1',
      candidate: { email: 'cand@example.com' },
      professional: { email: 'pro@example.com' },
      status: BookingStatus.accepted,
      candidateJoinedAt: null as Date | null,
      professionalJoinedAt: null as Date | null,
    };
    const prismaMock = {
      booking: {
        findFirst: async () => booking,
        update: async ({ data }: any) => {
          Object.assign(booking, data);
          return booking;
        },
      },
    };

    await recordZoomJoin('m1', 'cand@example.com', prismaMock as any);
    expect(booking.status).toBe(BookingStatus.accepted);
    expect(booking.candidateJoinedAt).toBeInstanceOf(Date);

    await recordZoomJoin('m1', 'pro@example.com', prismaMock as any);
    expect(booking.professionalJoinedAt).toBeInstanceOf(Date);
    expect(booking.status).toBe(BookingStatus.completed_pending_feedback);
  });
});

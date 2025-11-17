import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { withAuth } from '@/lib/core/api-helpers';
import { z } from 'zod';

const reviewSchema = z.object({
  bookingId: z.string(),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(50, 'Review must be at least 50 characters'),
  timezone: z.string().optional().default('UTC'),
});

/**
 * POST /api/reviews
 * Allows candidates to submit a review for a professional after a completed call
 */
export const POST = withAuth(async (session, req: NextRequest) => {
  try {

    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'validation_error', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { bookingId, rating, text, timezone } = parsed.data;

    // Verify booking exists and belongs to the current candidate
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        professionalReview: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'booking_not_found' },
        { status: 404 }
      );
    }

    // Only the candidate who booked can review
    if (booking.candidateId !== session.user.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    // Only allow reviews for completed bookings
    if (booking.status !== 'completed') {
      return NextResponse.json(
        { error: 'booking_not_completed', currentStatus: booking.status },
        { status: 400 }
      );
    }

    // Check if review already exists
    if (booking.professionalReview) {
      return NextResponse.json(
        { error: 'review_already_exists' },
        { status: 400 }
      );
    }

    // Create the review
    const review = await prisma.professionalReview.create({
      data: {
        bookingId,
        rating,
        text,
        timezone,
      },
    });

    return NextResponse.json({
      success: true,
      review: {
        bookingId: review.bookingId,
        rating: review.rating,
        text: review.text,
        submittedAt: review.submittedAt,
      },
    });
  } catch (error: any) {
    console.error('Review submission error:', error);
    return NextResponse.json(
      { error: 'internal_error', message: error.message },
      { status: 500 }
    );
  }
});

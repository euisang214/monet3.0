import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { withAuth } from '@/lib/core/api-helpers';
import { z } from 'zod';
import { API_ERRORS, validationError, notFoundError, forbiddenError, createErrorResponse, internalError } from '@/lib/core/errors';
import { rateLimit } from '@/lib/core/rate-limit';

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
    // Rate limit review submissions
    if (!rateLimit(`review:${session.user.id}`)) {
      return createErrorResponse(API_ERRORS.VALIDATION_ERROR, 429, { message: 'Too many review submissions. Please try again later.' });
    }

    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return validationError({ details: parsed.error.errors });
    }

    const { bookingId, rating, text, timezone } = parsed.data;

    // Verify booking exists and belongs to the current candidate
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        professionalRating: true,
      },
    });

    if (!booking) {
      return notFoundError(API_ERRORS.BOOKING_NOT_FOUND);
    }

    // Only the candidate who booked can review
    if (booking.candidateId !== session.user.id) {
      return forbiddenError();
    }

    // Only allow reviews for completed bookings
    if (booking.status !== 'completed') {
      return createErrorResponse(
        API_ERRORS.BOOKING_NOT_COMPLETED,
        400,
        { currentStatus: booking.status }
      );
    }

    // Check if review already exists
    if (booking.professionalRating) {
      return createErrorResponse(API_ERRORS.REVIEW_ALREADY_EXISTS);
    }

    // Create the review
    const review = await prisma.professionalRating.create({
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
    return internalError(error.message);
  }
});

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { notFoundError, internalError } from '@/lib/core/errors';

/**
 * GET /api/professionals/[id]/reviews
 * Retrieves all reviews for a specific professional (public endpoint)
 * Reviews are anonymized - candidate information is not exposed
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const professionalId = params.id;

    // Verify professional exists
    const professional = await prisma.user.findUnique({
      where: { id: professionalId },
    });

    if (!professional || professional.role !== 'PROFESSIONAL') {
      return notFoundError();
    }

    // Get all reviews for this professional
    // Only include reviews from completed bookings
    const reviews = await prisma.professionalRating.findMany({
      where: {
        booking: {
          professionalId: professionalId,
          status: 'completed',
        },
      },
      select: {
        bookingId: true,
        rating: true,
        text: true,
        submittedAt: true,
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    // Calculate average rating
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    // Count ratings by star level
    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    };

    return NextResponse.json({
      professionalId,
      totalReviews: reviews.length,
      averageRating: parseFloat(averageRating.toFixed(2)),
      ratingDistribution,
      reviews: reviews.map(review => ({
        rating: review.rating,
        text: review.text,
        submittedAt: review.submittedAt,
        // Exclude bookingId to maintain anonymity
      })),
    });
  } catch (error: any) {
    console.error('Get reviews error:', error);
    return internalError(error.message);
  }
}

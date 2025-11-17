import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db';

export async function GET(req: NextRequest){
  const url = new URL(req.url);
  const firm = url.searchParams.get('firm');
  const priceMax = Number(url.searchParams.get('priceMax') || 1000);
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 20))); // Default 20, max 100

  const where = {
    employer: firm || undefined,
    priceUSD: { lte: priceMax }
  };

  // Parallelize count and data queries for better performance
  const [pros, total] = await Promise.all([
    prisma.professionalProfile.findMany({
      where,
      select: {
        userId: true,
        employer: true,
        title: true,
        priceUSD: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        priceUSD: 'asc', // Sort by price for consistent pagination
      },
    }),
    prisma.professionalProfile.count({ where }),
  ]);

  const view = pros.map(p => ({
    userId: p.userId,
    employer: p.employer,
    title: p.title,
    priceUSD: p.priceUSD,
    tags: (p as any).tags || [],
  }));

  return NextResponse.json({
    results: view,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  });
}

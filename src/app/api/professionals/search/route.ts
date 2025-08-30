import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db';

export async function GET(req: NextRequest){
  const url = new URL(req.url);
  const firm = url.searchParams.get('firm');
  const priceMax = Number(url.searchParams.get('priceMax') || 1000);
  const pros = await prisma.professionalProfile.findMany({
    where: {
      employer: firm || undefined,
      priceUSD: { lte: priceMax }
    },
    take: 50,
  });
  const view = pros.map(p => ({
    userId: p.userId,
    employer: p.employer,
    title: p.title,
    priceUSD: p.priceUSD,
    tags: (p as any).tags || [],
  }));
  return NextResponse.json({ results: view });
}

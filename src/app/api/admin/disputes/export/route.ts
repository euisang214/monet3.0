import { NextResponse } from 'next/server';
import { Parser } from 'json2csv';
import { prisma } from '../../../../../../lib/db';

export async function GET(){
  const data = await prisma.$queryRawUnsafe<any[]>(`SELECT 'stubbed' as note`);
  const parser = new Parser();
  const csv = parser.parse(data);
  return new NextResponse(csv, { headers: { 'Content-Type':'text/csv' } });
}

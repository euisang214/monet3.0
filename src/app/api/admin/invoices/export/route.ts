import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getExportData, dataToCSV } from '@/lib/core/admin-export';

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const data = await getExportData('invoices');
  const csv = dataToCSV(data);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="invoices.csv"',
    },
  });
}

import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/core/api-helpers';
import { getExportData, dataToCSV, type ExportType } from '@/lib/core/admin-export';

const VALID_EXPORT_TYPES: ExportType[] = [
  'users',
  'bookings',
  'payments',
  'payouts',
  'feedback',
  'audit-logs',
];

export async function GET(
  _req: Request,
  { params }: { params: { type: string } }
) {
  // Require admin role
  await requireRole(['ADMIN']);

  // Validate export type
  if (!VALID_EXPORT_TYPES.includes(params.type as ExportType)) {
    return NextResponse.json(
      { error: 'invalid_export_type', valid: VALID_EXPORT_TYPES },
      { status: 400 }
    );
  }

  const exportType = params.type as ExportType;
  const data = await getExportData(exportType);
  const csv = dataToCSV(data);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${exportType}.csv"`,
    },
  });
}

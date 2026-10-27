import {
  NextRequest,
  NextResponse,
} from 'next/server';

import { requireAdmin } from '../../../lib/require-admin';

import {
  fetchCombinedReportData,
} from '../../../lib/attendance-report-data';
import { buildUnitBreakdown } from '../../../lib/unit-attendance';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {

  const session = await requireAdmin();

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const sisId =
      request.nextUrl.searchParams.get('sis_id') ?? '';

    const data = await fetchCombinedReportData(sisId);

    return NextResponse.json({...data, unitBreakdown: buildUnitBreakdown(data)}, {
      headers: {
        'Cache-Control': 'private, no-store',
      },
    });

  } catch (error) {

    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : 'Unable to retrieve student record',
      },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
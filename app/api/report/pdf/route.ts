
import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '../../../../lib/require-admin';
import { fetchCombinedReportData } from '../../../../lib/attendance-report-data';
import { validSisId } from '../../../../lib/semester';
import { generateAttendancePdf } from '../../../../lib/pdf-report';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await requireAdmin();

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const sisId =
    request.nextUrl.searchParams.get('sis_id') ?? '';

  const kind =
    request.nextUrl.searchParams.get('type') ?? 'academic';

  if (
    !validSisId(sisId) ||
    !['academic', 'compliance'].includes(kind)
  ) {
    return NextResponse.json(
      { error: 'Invalid student ID or report type' },
      { status: 400 }
    );
  }

  try {
    const data = await fetchCombinedReportData(sisId);

    // PDF generation is now asynchronous.
    const bytes = await generateAttendancePdf(
      data,
      kind as 'academic' | 'compliance',
      session.user?.email ?? 'Authorised administrator'
    );

    const pdfBuffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(pdfBuffer).set(bytes);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition':
          `attachment; filename="FYP_${kind}_${sisId}_DRAFT.pdf"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
      },
    });
  } catch (error) {
    console.error(
      'PDF generation failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );

    return NextResponse.json(
      {
        error:
          'PDF generation failed. Check the report data and n8n integrations.',
      },
      { status: 502 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/require-admin';
import { fetchCombinedReportData } from '../../../../lib/attendance-report-data';
import { validSisId } from '../../../../lib/semester';

export const dynamic = 'force-dynamic';

function csv(value: unknown): string {
  let text = String(value ?? '');
  // Prevent spreadsheet formula injection when opened in Excel.
  if (/^[\s\x00-\x1f]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sisId = request.nextUrl.searchParams.get('sis_id') ?? '';
  if (!validSisId(sisId)) return NextResponse.json({ error: 'Invalid SIS ID' }, { status: 400 });
  try {
    const data = await fetchCombinedReportData(sisId);
    const lines = [
      ['sis_id', 'student_name', 'semester', 'intake', 'attendance_percentage', 'attendance_source', 'profile_source', 'report_status'].map(csv).join(','),
      ...data.semesters.map(s => [
        data.profile.sisId,
        data.profile.fullName,
        s.label,
        s.intake,
        s.percentage === null ? '' : s.percentage,
        s.source,
        'STUDENT_PROFILE_EMULATOR',
        'DEMONSTRATION_ONLY_NOT_ISSUED',
      ].map(csv).join(',')),
    ];
    return new NextResponse('\uFEFF' + lines.join('\r\n') + '\r\n', {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="FYP_attendance_${sisId}_DRAFT.csv"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('CSV report generation failed', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'CSV could not be generated. Check the n8n integrations.' }, { status: 502 });
  }
}

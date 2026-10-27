import {
  NextRequest,
  NextResponse,
} from 'next/server';

import { requireAdmin } from '../../../lib/require-admin';

import {
  fetchCombinedReportData,
} from '../../../lib/attendance-report-data';

import {
  buildAttendanceReportHtml,
} from '../../../lib/attendanceReportHtml';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {

  const session = await requireAdmin();

  if (!session) {
    return new NextResponse('Unauthorized', {
      status: 401,
    });
  }

  try {
    const sisId =
      request.nextUrl.searchParams.get('sis_id') ?? '';

    const data = await fetchCombinedReportData(sisId);

    const html = buildAttendanceReportHtml({

      // Student Profile Emulator
      studentName: data.profile.fullName,
      sisId: data.profile.sisId,

      program: data.profile.programme.name,
      programmeCode: data.profile.programme.code,

      faculty: data.profile.faculty,
      studentType: data.profile.studentType,
      studentCategory: data.profile.studentType,

      studentEmail: data.profile.email,
      campus: data.profile.campus,
      yearOfStudy: data.profile.yearOfStudy,

      currentSemester: data.profile.semester,
      enrollmentStatus: data.profile.academicStatus,

      // Separate attendance workflow
      period:
        data.semesters.map(s => s.label).join(' to ') ||
        'Not available',

      semesters: data.semesters.map(s => ({
        intake: s.intake,
        percentage: s.percentage,
        source: s.source,
      })),

      // Data provenance
      isSynthetic: data.isSynthetic,
      profileIsSynthetic: data.profile.isSynthetic,
    });

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, no-store',

        'Content-Security-Policy':
          "default-src 'none'; " +
          "img-src data:; " +
          "style-src 'unsafe-inline'; " +
          "script-src 'unsafe-inline'; " +
          "base-uri 'none'; " +
          "form-action 'none'; " +
          "frame-ancestors 'none'",

        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
      },
    });

  } catch (error) {

    return new NextResponse(
      error instanceof Error
        ? error.message
        : 'Report unavailable',
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
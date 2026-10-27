import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/require-admin';
import { fetchBatch, parseIds } from '../../../../lib/batch';
import { buildExcelWorkbook, type ExcelSheet, type ExcelValue } from '../../../../lib/xlsx';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({error:'Unauthorized'},{status:401});
  try {
    const body = await request.json() as { ids?: unknown };
    if (!Array.isArray(body?.ids) || !body.ids.every(v => typeof v === 'string')) {
      return NextResponse.json({error:'Expected {"ids":["123456"]}'},{status:400});
    }
    const ids = parseIds(body.ids);
    const results = await fetchBatch(ids);
    const students: ExcelValue[][] = [];
    const semesters: ExcelValue[][] = [];
    const units: ExcelValue[][] = [];
    const weeks: ExcelValue[][] = [];
    const errors: ExcelValue[][] = [];
    for (const row of results) {
      if (!row.data) { errors.push([row.sisId, row.error || 'Unknown error']); continue; }
      const d = row.data;
      students.push([d.profile.sisId, d.profile.fullName, d.profile.email, d.profile.programme.name,
        d.profile.studentType, d.profile.visa?.status ?? 'Not available', 'Emulated Profile']);
      for (const s of d.semesters) {
        semesters.push([d.profile.sisId, d.profile.fullName, s.label, s.intake,
          s.percentage, s.source, s.calculationMethod || '', 'Semester source and weekly fixtures are independent']);
      }
      for (const sem of row.unitBreakdown ?? []) for (const unit of sem.units) {
        units.push([d.profile.sisId, d.profile.fullName, sem.semesterLabel, unit.code, unit.name,
          unit.percentage, unit.weekCount, 'Demo weekly data', unit.semesterAssignment]);
        for (const w of unit.weeks) weeks.push([
          d.profile.sisId, d.profile.fullName, sem.semesterLabel, unit.code, w.week,
          w.classStatus, w.labStatus, w.classScore, w.labScore, w.weekScore, w.weekPercent,
          'Demo weekly data',
        ]);
      }
    }
    const sheets: ExcelSheet[] = [
      {name:'Students',headers:['Student ID','Student Name','Email','Programme','Student Type','Visa Status','Data Source'],rows:students},
      {name:'Semesters',headers:['Student ID','Student Name','Semester','Intake','Attendance %','Data Source','Calculation','Note'],rows:semesters},
      {name:'Units',headers:['Student ID','Student Name','Semester','Unit Code','Unit Name','Attendance %','Weeks','Data Source','Semester Mapping'],rows:units},
      {name:'Weekly Checks',headers:['Student ID','Student Name','Semester','Unit Code','Week','Class','Lab','Class Score','Lab Score','Week Score','Week %','Data Source'],rows:weeks},
      {name:'Errors',headers:['Student ID','Error'],rows:errors},
      {name:'Read Me',headers:['Item','Explanation'],rows:[
        ['STATUS','DEMONSTRATION DATA ONLY. NOT AN OFFICIAL ATTENDANCE OR VISA RECORD.'],
        ['Week Rule','Class present + Lab present = 1.0; only one present = 0.5; neither present = 0.0.'],
        ['Week %','Week Score multiplied by 100.'],
        ['Unit Attendance %','Average weekly score over illustrated 12 weeks, multiplied by 100.'],
        ['Semester Attendance %','Retrieved separately from the configured n8n semester webhook.'],
        ['Important','Demo unit/week scores are not reconciled to the separately sourced semester percentage.'],
        ['Units','Unit names are from emulated Student Profile enrolments. Weekly statuses are deterministic fixtures, not Qwickly records.'],
        ['Missing Results','See Errors sheet. An unavailable record is not 0% attendance.'],
        ['Security','Export only for authorised administrative testing. Handle downloaded student data securely.'],
      ]},
    ];
    const workbook = buildExcelWorkbook(sheets);
    return new NextResponse(new Uint8Array(workbook), {headers: {
      'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':'attachment; filename="Smart_Attendance_Admin_Demo.xlsx"',
      'Cache-Control':'private, no-store',
      'X-Content-Type-Options':'nosniff',
    }});
  } catch (error) {
    return NextResponse.json({error: error instanceof Error ? error.message : 'Export failed'},
      {status:400,headers:{'Cache-Control':'no-store'}});
  }
}

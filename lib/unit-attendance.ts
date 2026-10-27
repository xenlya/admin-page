import type { CombinedReportData } from './attendance-report-data';

export type Presence = 'Present' | 'Absent';
export interface WeekAttendance {
  week: number;
  classStatus: Presence;
  labStatus: Presence;
  classScore: 0 | 1;
  labScore: 0 | 1;
  weekScore: 0 | 0.5 | 1;
  weekPercent: number;
  source: 'DEMO_WEEKLY_FIXTURE';
}
export interface UnitAttendance {
  code: string;
  name: string;
  semesterId: string;
  semesterLabel: string;
  semesterAssignment: 'MATCHED_EMULATED_ENROLMENT' | 'DEMO_CURRENT_ENROLMENT_ASSIGNMENT';
  percentage: number;
  weekCount: number;
  weeks: WeekAttendance[];
  source: 'DEMO_WEEKLY_FIXTURE';
}
export interface SemesterUnits {
  semesterId: string;
  semesterLabel: string;
  semesterPercentage: number | null;
  semesterSource: string;
  units: UnitAttendance[];
  note: string;
}
function hash(source: string): number {
  let h = 2166136261;
  for (const char of source) {
    h ^= char.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function key(value: string) { return value.toLowerCase().replace(/[^a-z0-9]/g, ''); }

/** Explicitly illustrative 12-week fixtures: not a Qwickly session export. */
export function buildUnitBreakdown(data: CombinedReportData): SemesterUnits[] {
  const semesters = data.semesters;
  const enrolled = data.profile.enrolments ?? [];
  return semesters.map((semester, semesterIndex) => {
    const units: UnitAttendance[] = [];
    for (const enrollment of enrolled) {
      const description = enrollment.semester || '';
      const meaningful = description.trim().length > 0;
      const match = meaningful && [semester.semesterId, semester.label, semester.intake]
        .filter(Boolean).some(value => key(description) === key(value) ||
          (key(value).length > 5 && key(description).includes(key(value))));
      // When the emulator provides no reliable semester mapping, only attach current
      // enrolments to the final semester, and label the mapping explicitly as a demo.
      const fallback = !match && semesterIndex === semesters.length - 1 &&
        !semesters.some(s => [s.semesterId, s.label, s.intake].some(v =>
          meaningful && (key(description) === key(v) ||
          (key(v).length > 5 && key(description).includes(key(v))))));
      if (!match && !fallback) continue;
      const code = enrollment.code || enrollment.unitId || 'Unknown unit';
      const weeks: WeekAttendance[] = Array.from({ length: 12 }, (_, i) => {
        const week = i + 1;
        const base = hash(`${data.profile.sisId}|${semester.semesterId}|${code}|${week}`);
        // Illustrative values: about four in five sessions present, stable per fixture.
        const classScore = (base % 11 < 9 ? 1 : 0) as 0 | 1;
        const labScore = ((Math.floor(base / 13) % 11) < 9 ? 1 : 0) as 0 | 1;
        const weekScore = ((classScore + labScore) / 2) as 0 | 0.5 | 1;
        return { week, classStatus: classScore ? 'Present' : 'Absent',
          labStatus: labScore ? 'Present' : 'Absent', classScore, labScore,
          weekScore, weekPercent: weekScore * 100, source: 'DEMO_WEEKLY_FIXTURE' };
      });
      const percentage = Math.round(weeks.reduce((sum, w) => sum + w.weekScore, 0) / weeks.length * 10000) / 100;
      units.push({ code, name: enrollment.name || code,
        semesterId: semester.semesterId, semesterLabel: semester.label,
        semesterAssignment: match ? 'MATCHED_EMULATED_ENROLMENT' : 'DEMO_CURRENT_ENROLMENT_ASSIGNMENT',
        percentage, weekCount: weeks.length, weeks, source: 'DEMO_WEEKLY_FIXTURE' });
    }
    return { semesterId: semester.semesterId, semesterLabel: semester.label,
      semesterPercentage: semester.percentage, semesterSource: semester.source,
      units, note: 'Unit/week rows are illustrative emulated fixtures; they are NOT calculated from Qwickly session records and do not reconcile to the n8n semester percentage.' };
  });
}

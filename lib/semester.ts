export interface SemesterRecord {
  semesterId: string;
  label: string;
  intake: string;
  startDate: string;
  endDate: string;
  percentage: number | null;
  source: 'DEMO_SYNTHETIC' | 'QWICKLY_INTAKE_VERIFIED';
  calculationMethod: string;
}
export interface SemesterResponse {
  success: boolean;
  student: { sisId: string };
  semesters: SemesterRecord[];
  source: 'DEMO_SYNTHETIC' | 'QWICKLY_INTAKE_VERIFIED';
  isSynthetic: boolean;
  message?: string;
}
export function validSisId(value: string): boolean { return /^\d{6,12}$/.test(value); }
export async function fetchSemester(sisId: string): Promise<SemesterResponse> {
  if (!validSisId(sisId)) throw new Error('Enter a valid numeric SIS ID (6–12 digits).');
  const base = process.env.SEMESTER_WEBHOOK_URL;
  if (!base) throw new Error('SEMESTER_WEBHOOK_URL is not configured.');
  const url = new URL(base);
  if (url.protocol !== 'https:' && !(url.hostname === 'localhost' && url.protocol === 'http:')) {
    throw new Error('A secure HTTPS webhook URL is required.');
  }
  url.searchParams.set('sis_id', sisId);
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`n8n returned HTTP ${response.status}`);
  const data: unknown = await response.json();
  if (!data || typeof data !== 'object') throw new Error('Unexpected n8n response');
  const d = data as Partial<SemesterResponse>;
  if (d.success !== true || d.student?.sisId !== sisId || !Array.isArray(d.semesters)) throw new Error('Invalid or mismatched student response');
  if (d.source !== 'DEMO_SYNTHETIC' && d.source !== 'QWICKLY_INTAKE_VERIFIED') throw new Error('Unknown data source');
  if (typeof d.isSynthetic !== 'boolean' || d.isSynthetic !== (d.source === 'DEMO_SYNTHETIC')) throw new Error('Inconsistent data source flag');
  for (const s of d.semesters) {
    if (!s || typeof s.semesterId !== 'string' || typeof s.label !== 'string' || typeof s.intake !== 'string' || s.source !== d.source ||
      !(s.percentage === null || (typeof s.percentage === 'number' && Number.isFinite(s.percentage) && s.percentage >= 0 && s.percentage <= 100))) {
      throw new Error('Invalid semester data');
    }
  }
  return d as SemesterResponse;
}
export function pct(value: number | null): string { return value === null ? 'N/A' : `${value.toFixed(2)}%`; }

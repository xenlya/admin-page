import { validSisId } from './semester';
import { fetchCombinedReportData, type CombinedReportData } from './attendance-report-data';
import { buildUnitBreakdown, type SemesterUnits } from './unit-attendance';
export const MAX_STUDENTS = 25;
export interface BatchStudent {
  sisId: string;
  data?: CombinedReportData;
  unitBreakdown?: SemesterUnits[];
  error?: string;
}
export function parseIds(input: string | string[]): string[] {
  const tokens = (Array.isArray(input) ? input : input.split(/[\s,;]+/))
    .map(s => String(s).trim()).filter(Boolean);
  const ids = Array.from(new Set(tokens));
  if (ids.length === 0) throw new Error('Enter at least one student SIS ID.');
  if (ids.length > MAX_STUDENTS) throw new Error(`A maximum of ${MAX_STUDENTS} students per request is supported.`);
  const invalid = ids.filter(id => !validSisId(id));
  if (invalid.length) throw new Error(`Invalid SIS ID: ${invalid.slice(0, 4).join(', ')}. Use 6–12 digits per student.`);
  return ids;
}
export async function fetchBatch(ids: string[]): Promise<BatchStudent[]> {
  const results: BatchStudent[] = new Array(ids.length);
  // Restrict concurrency to avoid overloading emulated webhook and n8n.
  let cursor = 0;
  async function worker() {
    while (cursor < ids.length) {
      const index = cursor++;
      const sisId = ids[index];
      try {
        const data = await fetchCombinedReportData(sisId);
        results[index] = { sisId, data, unitBreakdown: buildUnitBreakdown(data) };
      } catch (err) {
        results[index] = { sisId, error: err instanceof Error ? err.message : 'Unable to load student' };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, ids.length) }, () => worker()));
  return results;
}

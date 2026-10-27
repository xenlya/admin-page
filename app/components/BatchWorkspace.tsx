'use client'; // Run in the browser: needed for state, fetch and form handling

/* ============================================================================
 * BatchWorkspace
 * ----------------------------------------------------------------------------
 * Admin workspace for looking up several students at once by SIS ID.
 * The same component powers four sidebar pages (see WorkspaceMode); the `mode`
 * prop only changes the heading and which table columns are shown.
 *
 * Flow:  type/paste IDs -> validate -> POST /api/students/batch -> show results
 *        -> optionally export everything to Excel via /api/export/excel
 * ========================================================================== */

// ─── Imports ────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import type { BatchStudent } from '../../lib/batch';
import { pct } from '../../lib/semester'; // Formats a number | null as a percentage string
import styles from './portal.module.css';

// ─── Constants & Types ──────────────────────────────────────────────────────

// Maximum number of student IDs allowed in a single search
const MAX_STUDENTS = 25;

// The four views this workspace can render
export type WorkspaceMode = 'students' | 'attendance' | 'visa' | 'reports';

// Heading text shown for each mode
const titles: Record<WorkspaceMode, string> = {
  students: 'Find students',
  attendance: 'Attendance overview',
  visa: 'Visa review',
  reports: 'Report exports',
};

// ─── Helper Functions ───────────────────────────────────────────────────────

// Turn the raw textarea text into a clean list of unique IDs:
//   1. split on whitespace, commas or semicolons
//   2. trim each piece
//   3. drop empty pieces
//   4. remove duplicates (via Set)
function idsFromInput(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(/[\s,;]+/)
        .map((x) => x.trim())
        .filter(Boolean)
    )
  );
}

// Format a score (number or null) as a percentage string
function scoreValue(x: number | null): string {
  return pct(x);
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function BatchWorkspace({
  mode,
  initialIds = '',
}: {
  mode: WorkspaceMode;
  initialIds?: string;
}) {
  // ── State ────────────────────────────────────────────────────────────────
  const [input, setInput] = useState(initialIds);          // Text currently in the textarea
  const [results, setResults] = useState<BatchStudent[]>([]); // Per-student lookup results
  const [busy, setBusy] = useState(false);                 // True while a search is running
  const [exporting, setExporting] = useState(false);       // True while the Excel file is built
  const [error, setError] = useState('');                  // Error message shown to the user

  // ── Load students ────────────────────────────────────────────────────────
  // Validates the IDs, sends them to the batch endpoint and stores the results
  async function load(ids: string[]) {
    // Reset UI to a "loading" state
    setBusy(true);
    setError('');
    setResults([]);

    try {
      // Validation: 1..MAX_STUDENTS IDs, each one numeric with 6–12 digits
      if (
        ids.length === 0 ||
        ids.length > MAX_STUDENTS ||
        ids.some((x) => !/^\d{6,12}$/.test(x))
      )
        throw new Error(
          `Enter 1–${MAX_STUDENTS} numeric student IDs, each 6–12 digits. Separate IDs using commas, spaces or new lines.`
        );

      // Ask the server for all students in one request (never cached)
      const response = await fetch('/api/students/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
        cache: 'no-store',
      });
      const json = await response.json();

      // Non-2xx response: surface the server's error message
      if (!response.ok) throw new Error(json.error || 'Student lookup failed');

      // Success: keep the results for rendering
      setResults(json.results as BatchStudent[]);
    } catch (err) {
      // Show a readable error message
      setError(err instanceof Error ? err.message : 'Unable to retrieve students');
    } finally {
      // Always stop the loading state, success or failure
      setBusy(false);
    }
  }

  // ── Auto-load from URL/props ─────────────────────────────────────────────
  // If IDs were supplied up front (e.g. ?ids=...), search immediately
  useEffect(() => {
    if (initialIds.trim()) {
      void load(idsFromInput(initialIds));
    }
  }, [initialIds]);

  // ── Form submit ──────────────────────────────────────────────────────────
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); // Stop the browser's default page reload

    // Parse the textarea into a clean ID list
    const ids = idsFromInput(input);

    // Mirror the IDs into the address bar so the page is shareable / refresh-safe
    const qs = new URLSearchParams({ ids: ids.join(',') });
    window.history.replaceState(null, '', `${window.location.pathname}?${qs.toString()}`);

    // Run the search
    void load(ids);
  }

  // ── Derived data ─────────────────────────────────────────────────────────
  const success = results.filter((x) => x.data);  // Students that loaded fine
  const failed = results.filter((x) => x.error);  // Students whose lookup failed

  // ── Excel export ─────────────────────────────────────────────────────────
  // Sends the IDs to the export endpoint and triggers a file download
  async function downloadExcel() {
    // Prefer IDs from loaded results; otherwise fall back to the textarea
    const ids = results.length ? results.map((x) => x.sisId) : idsFromInput(input);

    // Nothing to export
    if (!ids.length) {
      setError('Search at least one student first.');
      return;
    }

    setExporting(true);
    setError('');

    try {
      // Ask the server to build the workbook
      const r = await fetch('/api/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });

      // On failure, show the server's error message
      if (!r.ok) {
        const j = await r.json();
        throw new Error(j.error || 'Excel export failed');
      }

      // Turn the response into a temporary downloadable URL
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);

      // Create a hidden link, click it to start the download, then clean up
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Smart_Attendance_Admin_Demo.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url); // Free the memory held by the blob URL
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* ───────── Search panel: heading, textarea, buttons, error ───────── */}
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <h2>{titles[mode]}</h2>
            <p>
              Search several students in one request. Student records are returned by the
              existing emulated n8n endpoints.
            </p>
          </div>
          <span className={styles.badge}>Up to {MAX_STUDENTS} students</span>
        </div>

        <form onSubmit={onSubmit}>
          <label htmlFor="student-ids" className={styles.inputLabel}>
            STUDENT SIS IDS (ONE PER LINE OR SEPARATED BY COMMAS)
          </label>

          {/* Where the user types or pastes IDs */}
          <textarea
            id="student-ids"
            className={styles.textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={'104404156\n104404157\n104404158\nStudent IDs'}
            rows={3}
            disabled={busy}
          />

          <div className={styles.row} style={{ marginTop: 15 }}>
            {/* Submit: runs the search */}
            <button className={styles.button} type="submit" disabled={busy}>
              {busy ? 'Loading students…' : '⌕  Search Students'}
            </button>

            {/* Export: downloads everything as .xlsx */}
            <button
              className={`${styles.button} ${styles.secondaryButton}`}
              disabled={busy || exporting}
              type="button"
              onClick={downloadExcel}
            >
              {exporting ? 'Preparing Excel…' : '⇩  Export Excel (.xlsx)'}
            </button>

            <span className={styles.muted}>
              Duplicate IDs are ignored. Errors are shown per student.
            </span>
          </div>
        </form>

        {/* Error message (announced by screen readers via role="alert") */}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </section>

      {/* ───────── Results area: only shown once there are results ───────── */}
      {results.length > 0 && (
        <>
          {/* KPI summary cards */}
          <div className={styles.kpis}>
            <div className={`${styles.kpi} ${styles.redKpi}`}>
              <span>Requested</span>
              <strong>{results.length}</strong>
              <small>Unique SIS IDs</small>
            </div>

            <div className={styles.kpi}>
              <span>Loaded</span>
              <strong>{success.length}</strong>
              <small>Available emulator results</small>
            </div>

            <div className={styles.kpi}>
              <span>Errors</span>
              <strong>{failed.length}</strong>
              <small>Listed individually below</small>
            </div>

            <div className={styles.kpi}>
              <span>Unit fixtures</span>
              {/* Total number of units across every semester of every loaded student */}
              <strong>
                {success.reduce(
                  (total, x) =>
                    total + (x.unitBreakdown ?? []).reduce((n, s) => n + s.units.length, 0),
                  0
                )}
              </strong>
              <small>Demonstration only</small>
            </div>
          </div>

          {/* Results table panel */}
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                {/* Heading changes with the current mode */}
                <h2>
                  {mode === 'visa'
                    ? 'Student visa review'
                    : mode === 'attendance'
                    ? 'Semester attendance comparison'
                    : mode === 'reports'
                    ? 'Available report formats'
                    : 'Search results'}
                </h2>
                <p>
                  Click a student to open their profile, then expand a semester and a unit to
                  inspect weekly Class/Lab scores.
                </p>
              </div>

              {/* Second export button (same action as the one above) */}
              <button
                className={`${styles.button} ${styles.secondaryButton}`}
                onClick={downloadExcel}
                disabled={exporting}
              >
                {exporting ? 'Exporting…' : 'Download Excel'}
              </button>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                {/* Column headers: the middle columns depend on the mode */}
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Student Name</th>

                    {mode === 'visa' ? (
                      <>
                        <th>Student Type</th>
                        <th>Visa Status</th>
                      </>
                    ) : mode === 'attendance' ? (
                      <>
                        <th>Semesters</th>
                        <th>Latest Semester %</th>
                      </>
                    ) : mode === 'reports' ? (
                      <>
                        <th>Academic PDF</th>
                        <th>Compliance PDF</th>
                      </>
                    ) : (
                      <>
                        <th>Programme</th>
                        <th>Semesters</th>
                      </>
                    )}

                    <th>Action</th>
                  </tr>
                </thead>

                {/* One row per requested student */}
                <tbody>
                  {results.map((row) => (
                    <tr key={row.sisId}>
                      <td>
                        <strong>{row.sisId}</strong>
                      </td>

                      {row.data ? (
                        /* ── Successful lookup: show the data cells ── */
                        <>
                          <td>{row.data.profile.fullName}</td>

                          {mode === 'visa' ? (
                            /* Visa mode: student type + visa status badge */
                            <>
                              <td>{row.data.profile.studentType}</td>
                              <td>
                                <span className={styles.badge}>
                                  {row.data.profile.visa?.status || 'Unknown (demo)'}
                                </span>
                              </td>
                            </>
                          ) : mode === 'attendance' ? (
                            /* Attendance mode: semester count + latest semester percentage */
                            <>
                              <td>{row.data.semesters.length}</td>
                              <td>
                                <strong>
                                  {scoreValue(
                                    row.data.semesters[row.data.semesters.length - 1]
                                      ?.percentage ?? null
                                  )}
                                </strong>
                              </td>
                            </>
                          ) : mode === 'reports' ? (
                            /* Reports mode: links to the two PDF reports (open in new tab) */
                            <>
                              <td>
                                <a
                                  className={styles.textLink}
                                  href={`/api/report/pdf?sis_id=${encodeURIComponent(
                                    row.sisId
                                  )}&type=academic`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Academic PDF ↗
                                </a>
                              </td>
                              <td>
                                <a
                                  className={styles.textLink}
                                  href={`/api/report/pdf?sis_id=${encodeURIComponent(
                                    row.sisId
                                  )}&type=compliance`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Compliance PDF ↗
                                </a>
                              </td>
                            </>
                          ) : (
                            /* Default (students) mode: programme name + semester count */
                            <>
                              <td>{row.data.profile.programme.name}</td>
                              <td>{row.data.semesters.length}</td>
                            </>
                          )}

                          {/* Link to the student's full profile page */}
                          <td>
                            <Link
                              className={styles.textLink}
                              href={`/students/${encodeURIComponent(row.sisId)}`}
                            >
                              Open profile →
                            </Link>
                          </td>
                        </>
                      ) : (
                        /* ── Failed lookup: one red error badge spanning the columns ── */
                        <td
                          colSpan={
                            mode === 'visa' || mode === 'attendance' || mode === 'reports' ? 4 : 4
                          }
                        >
                          <span className={styles.redBadge}>{row.error}</span>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mode-specific footnotes */}
            {mode === 'attendance' && (
              <p className={styles.footnote}>
                Semester percentages are returned by n8n. The unit/weekly drill-down is a
                separately generated demo fixture and must not be used to calculate or overwrite
                official semester percentages.
              </p>
            )}
            {mode === 'reports' && (
              <p className={styles.footnote}>
                Academic PDF and compliance PDF remain draft documents. The Excel export includes
                all students, semesters, units and weekly Class/Lab rows, plus errors and
                explanatory notes.
              </p>
            )}
          </section>
        </>
      )}

      {/* ───────── Empty state: before any search has been run ───────── */}
      {results.length === 0 && !busy && (
        <div className={styles.panel}>
          <div className={styles.empty}>
            Enter several SIS IDs above to begin. Use the sidebar to switch between dedicated
            functions.
          </div>
        </div>
      )}
    </>
  );
}
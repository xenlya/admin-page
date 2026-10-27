
/**
 * A4 draft student attendance report.
 *
 * Student profile and attendance data may be synthetic.
 * This report is a prototype and is not an official
 * university-issued document.
 *
 * Logo location:
 *   lib/logo.png
 *
 * The logo is embedded as Base64 so that it appears
 * in both the browser and exported PDF.
 */

import fs from 'node:fs';
import path from 'node:path';

// --------------------------------------------------
// TYPES
// --------------------------------------------------

export type IntakeAttendance = {
  intake: string;
  percentage: number | null;
  source?: string;
};

export type AttendanceReportInput = {
  studentName: string;
  sisId: string;

  program: string;
  programmeCode?: string;

  faculty?: string;
  studentType?: string;
  studentCategory?: string | null;

  studentEmail?: string;
  campus?: string;

  yearOfStudy?: number | null;
  currentSemester?: string;
  enrollmentStatus?: string;

  period: string;
  reference?: string;
  reportDate?: Date;

  semesters: IntakeAttendance[];

  isSynthetic: boolean;
  profileIsSynthetic?: boolean;
};

// --------------------------------------------------
// LOGO
// --------------------------------------------------

function getLogoBase64(): string {
  const logoPath = path.join(
    process.cwd(),
    'lib',
    'logo.png'
  );

  if (!fs.existsSync(logoPath)) {
    throw new Error(
      `Report logo not found: ${logoPath}`
    );
  }

  const logoBuffer = fs.readFileSync(logoPath);

  return (
    'data:image/png;base64,' +
    logoBuffer.toString('base64')
  );
}

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function percentageLabel(
  value: number | null
): string {
  if (
    value === null ||
    !Number.isFinite(value)
  ) {
    return 'N/A';
  }

  return `${value.toFixed(2)}%`;
}

/**
 * Provisional classifications.
 * These thresholds are not official university rules.
 */
function attendanceLabel(
  value: number | null
): string {
  if (
    value === null ||
    !Number.isFinite(value)
  ) {
    return 'N/A';
  }

  if (value === 0) return 'Nil';
  if (value >= 80) return 'Good';
  if (value >= 40) return 'Fair';

  return 'Poor';
}

function detailRow(
  label: string,
  value: unknown
): string {
  const displayValue =
    value === null ||
    value === undefined ||
    value === ''
      ? 'N/A'
      : String(value);

  return `
    <div class="detail-row">
      <div class="detail-label">
        ${escapeHtml(label)}
      </div>

      <div class="detail-colon">:</div>

      <div class="detail-value">
        ${escapeHtml(displayValue)}
      </div>
    </div>
  `;
}

// --------------------------------------------------
// REPORT GENERATOR
// --------------------------------------------------

export function buildAttendanceReportHtml(
  input: AttendanceReportInput
): string {
  const logoSrc = getLogoBase64();

  const date = input.reportDate ?? new Date();

  const dateLabel = date.toLocaleDateString(
    'en-GB',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  );

  const reference = input.reference ||
    'DRAFT / NOT ISSUED';

  const programme = input.programmeCode
    ? `${input.program} (${input.programmeCode})`
    : input.program;

  const studentCategory =
    input.studentCategory ||
    input.studentType ||
    'N/A';

  // ----------------------------------------------
  // STUDENT DETAILS
  // ----------------------------------------------

  const studentDetails = [
    detailRow('Student ID', input.sisId),
    detailRow('Name', input.studentName),
    detailRow('Programme', programme),
    detailRow('Faculty', input.faculty),
    detailRow('Email', input.studentEmail),
    detailRow('Campus', input.campus),
    detailRow('Year of Study', input.yearOfStudy),
    detailRow(
      'Academic Status',
      input.enrollmentStatus
    ),
    detailRow(
      'Student Category',
      studentCategory
    ),
    detailRow(
      'Current Semester',
      input.currentSemester
    ),
    detailRow(
      'Attendance Period',
      input.period
    ),
  ].join('');

  // ----------------------------------------------
  // ATTENDANCE ROWS
  // ----------------------------------------------

  const attendanceRows = input.semesters
    .map((semester) => {
      const label = attendanceLabel(
        semester.percentage
      );

      const percentage = percentageLabel(
        semester.percentage
      );

      return `
        <tr>
          <td>
            ${escapeHtml(semester.intake)}
          </td>

          <td>
            ${escapeHtml(label)}
          </td>

          <td>
            ${escapeHtml(percentage)}
          </td>
        </tr>
      `;
    })
    .join('');

  const noAttendanceRow = `
    <tr>
      <td colspan="3">
        No attendance data available
      </td>
    </tr>
  `;

  // ----------------------------------------------
  // SOURCE NOTICES
  // ----------------------------------------------

  const profileNotice =
    input.profileIsSynthetic
      ? 'SYNTHETIC STUDENT PROFILE'
      : 'Student profile requires source verification';

  const attendanceNotice =
    input.isSynthetic
      ? 'ATTENDANCE VALUES ARE SYNTHETIC DEMONSTRATION DATA.'
      : 'Attendance source verification and administrator approval are required.';

  // ----------------------------------------------
  // HTML DOCUMENT
  // ----------------------------------------------

  return `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  />

  <title>
    Draft Attendance Report - ${escapeHtml(input.sisId)}
  </title>

  <style>

    /* ==========================================
       PAGE CONFIGURATION
    ========================================== */

    @page {
      size: A4 portrait;
      margin: 0;
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;

      background: #edf0f4;
      color: #20232b;

      font-family:
        Arial,
        Helvetica,
        sans-serif;

      font-size: 10px;
      line-height: 1.45;
    }

    /* ==========================================
       BROWSER TOOLBAR
    ========================================== */

    .toolbar {
      max-width: 210mm;
      margin: 16px auto;

      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 15px;

      font-size: 12px;
      color: #4b5563;
    }

    .toolbar button {
      border: 0;
      border-radius: 7px;

      background: #c8102e;
      color: #ffffff;

      padding: 11px 18px;

      font-size: 12px;
      font-weight: bold;

      cursor: pointer;
    }

    .toolbar button:hover {
      background: #a30b25;
    }

    /* ==========================================
       A4 SHEET
    ========================================== */

    .sheet {
      position: relative;

      width: 210mm;
      min-height: 297mm;

      margin: 0 auto 24px;

      background: #ffffff;

      box-shadow:
        0 4px 24px rgba(0, 0, 0, 0.12);

      padding:
        38mm
        23mm
        26mm
        30mm;

      overflow: hidden;
    }

    /* Decorative vertical line */

    .sheet::before {
      content: '';

      position: absolute;

      top: 93mm;
      bottom: 20mm;
      left: 15mm;

      width: 1.5mm;

      background: #c8102e;
    }

    /* ==========================================
       DRAFT BADGE
    ========================================== */

    .draft {
      position: absolute;

      top: 12mm;
      left: 30mm;

      border: 1px solid #c8102e;

      color: #a30b25;
      background: #fff5f6;

      padding: 5px 9px;

      font-size: 9px;
      font-weight: bold;

      letter-spacing: 0.4px;
    }

    /* ==========================================
       UNIVERSITY LOGO
       TOP RIGHT
    ========================================== */

    .report-logo {
      position: absolute;

      top: 22mm;
      right: 23mm;

      width: 42mm;
      height: 24mm;

      display: flex;
      align-items: flex-start;
      justify-content: flex-end;

      z-index: 2;
    }

    .report-logo img {
      display: block;

      width: 100%;
      height: 100%;

      object-fit: contain;
      object-position: right top;
    }

    /* ==========================================
       REFERENCE AND DATE
    ========================================== */

    .meta {
      margin-top: 15mm;
      margin-bottom: 11mm;

      font-size: 10px;
    }

    .meta-row {
      display: flex;
      align-items: baseline;

      margin-bottom: 4px;
    }

    .meta-label {
      width: 38px;
      flex-shrink: 0;
    }

    .meta-value {
      font-weight: 500;
    }

    /* ==========================================
       LETTER CONTENT
    ========================================== */

    .letter-title {
      font-size: 11px;
      font-weight: bold;

      margin: 0 0 9mm;
    }

    .salutation {
      margin: 0 0 4mm;
    }

    .subject {
      font-size: 11px;
      font-weight: bold;

      text-decoration: underline;

      margin: 0 0 5mm;

      line-height: 1.5;
    }

    .intro {
      max-width: 145mm;

      line-height: 1.6;

      margin: 0 0 6mm;
    }

    /* ==========================================
       STUDENT INFORMATION
    ========================================== */

    .details {
      margin:
        0
        0
        7mm
        7mm;

      max-width: 145mm;
    }

    .detail-row {
      display: grid;

      grid-template-columns:
        31mm
        4mm
        minmax(0, 1fr);

      gap: 2mm;

      margin-bottom: 2.3mm;

      line-height: 1.5;

      break-inside: avoid;
    }

    .detail-label {
      font-weight: bold;
      color: #30343d;
    }

    .detail-colon {
      text-align: center;
    }

    .detail-value {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    /* ==========================================
       TABLES
    ========================================== */

    table {
      border-collapse: collapse;

      font-size: 10px;

      break-inside: avoid;
    }

    th,
    td {
      border: 1px solid #666666;

      padding: 6px 9px;

      text-align: center;
      vertical-align: middle;
    }

    th {
      background: #f1f2f4;

      font-weight: bold;
    }

    /* ==========================================
       ATTENDANCE TABLE
    ========================================== */

    .attendance {
      width: 140mm;

      max-width: 100%;

      margin:
        0
        0
        7mm
        7mm;
    }

    .attendance th {
      background: #f7e8ec;
      color: #6e1024;
    }

    .attendance th:nth-child(1) {
      width: 42%;
    }

    .attendance th:nth-child(2) {
      width: 32%;
    }

    .attendance th:nth-child(3) {
      width: 26%;
    }

    /* ==========================================
       CLASSIFICATION KEY
    ========================================== */

    .key {
      width: 88mm;

      max-width: 100%;

      margin:
        0
        0
        6mm
        7mm;
    }

    .key th {
      background: #f1f2f4;
    }

    /* ==========================================
       SOURCE NOTICE
    ========================================== */

    .source-note {
      margin:
        4mm
        0
        0
        7mm;

      max-width: 140mm;

      color: #8f2638;

      font-size: 9px;
      line-height: 1.6;
    }

    /* ==========================================
       CONTACT
    ========================================== */

    .queries {
      margin-top: 7mm;

      line-height: 1.6;
    }

    /* ==========================================
       SIGN-OFF
    ========================================== */

    .signoff {
      margin-top: 8mm;
    }

    .signature-space {
      width: 65mm;
      height: 13mm;

      border-bottom:
        1px dashed #bbbbbb;
    }

    .issuer {
      margin-top: 3mm;

      font-size: 10px;
      line-height: 1.6;
    }

    /* ==========================================
       FOOTER
    ========================================== */

    .footer {
      position: absolute;

      bottom: 13mm;
      left: 30mm;
      right: 23mm;

      display: flex;
      justify-content: space-between;

      gap: 10mm;

      padding-top: 4mm;

      border-top: 1px solid #e2e2e2;

      font-size: 8px;
      color: #777777;
    }

    .footer span:last-child {
      text-align: right;
    }

    /* ==========================================
       PRINT / PDF
    ========================================== */

    @media print {

      html,
      body {
        background: white;
        width: 210mm;
      }

      .toolbar {
        display: none !important;
      }

      .sheet {
        width: 210mm;
        min-height: 297mm;

        margin: 0;

        box-shadow: none;

        break-after: auto;
      }

      .report-logo {
        top: 22mm;
        right: 23mm;
      }

      .report-logo img {
        width: 100%;
        height: 100%;
      }

      .attendance,
      .key,
      .detail-row {
        break-inside: avoid;
      }

      body,
      .sheet,
      th,
      .draft {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }

    /* ==========================================
       SMALL SCREEN BROWSER PREVIEW
    ========================================== */

    @media screen and (max-width: 820px) {

      .toolbar {
        margin: 12px;
      }

      .sheet {
        margin-left: 12px;
        margin-right: 12px;
      }
    }

  </style>
</head>

<body>

  <!-- ========================================
       BROWSER ACTION BAR
  ======================================== -->

  <div class="toolbar">

    <span>
      Draft attendance report — review before saving
    </span>

    <button
      type="button"
      onclick="window.print()"
    >
      Print / Save as PDF
    </button>

  </div>

  <!-- ========================================
       A4 REPORT
  ======================================== -->

  <article class="sheet">

    <!-- DRAFT NOTICE -->

    <div class="draft">
      DRAFT — NOT FOR OFFICIAL ISSUANCE
    </div>

    <!-- UNIVERSITY LOGO -->

    <div class="report-logo">
      <img
        src="${logoSrc}"
        alt="Swinburne University Logo"
      />
    </div>

    <!-- REFERENCE / DATE -->

    <div class="meta">

      <div class="meta-row">
        <span class="meta-label">Ref:</span>
        <span class="meta-value">
          ${escapeHtml(reference)}
        </span>
      </div>

      <div class="meta-row">
        <span class="meta-label">Date:</span>
        <span class="meta-value">
          ${escapeHtml(dateLabel)}
        </span>
      </div>

    </div>

    <!-- LETTER HEADING -->

    <h1 class="letter-title">
      TO WHOM IT MAY CONCERN
    </h1>

    <p class="salutation">
      Dear Sir/Madam,
    </p>

    <p class="subject">
      ATTENDANCE REPORT FOR
      ${escapeHtml(input.studentName.toUpperCase())}
    </p>

    <p class="intro">
      With reference to the subject above,
      please find the draft attendance summary
      for the student stated below.
    </p>

    <!-- STUDENT DETAILS -->

    <div class="details">
      ${studentDetails}
    </div>

    <!-- ATTENDANCE TABLE -->

    <table
      class="attendance"
      aria-label="Attendance by intake"
    >

      <thead>
        <tr>
          <th>Intake</th>
          <th>Overall Attendance</th>
          <th>Percentages (%)</th>
        </tr>
      </thead>

      <tbody>
        ${attendanceRows || noAttendanceRow}
      </tbody>

    </table>

    <!-- CLASSIFICATION KEY -->

    <table
      class="key"
      aria-label="Attendance classification key"
    >

      <thead>
        <tr>
          <th>Key</th>
          <th>Percentages (%)</th>
        </tr>
      </thead>

      <tbody>

        <tr>
          <td>Good</td>
          <td>80 – 100</td>
        </tr>

        <tr>
          <td>Fair</td>
          <td>40 – 79.99</td>
        </tr>

        <tr>
          <td>Poor</td>
          <td>Above 0 – below 40</td>
        </tr>

        <tr>
          <td>Nil</td>
          <td>0</td>
        </tr>

      </tbody>

    </table>

    <!-- DATA SOURCE NOTICE -->

    <p class="source-note">
      Student details are sourced from the
      emulated Student Profile API.
      ${escapeHtml(profileNotice)}.
      Classification bands are provisional
      and require Registrar confirmation.
      ${escapeHtml(attendanceNotice)}
    </p>

    <!-- CONTACT -->

    <div class="queries">
      If there are any further queries,
      please contact the SE / Registrar Office.
    </div>

    <!-- DRAFT SIGN-OFF -->

    <div class="signoff">

      Yours sincerely,

      <div class="signature-space"></div>

      <div class="issuer">
        SE / Registrar Office
        (draft placeholder)

        <div>
          University administrative
          reporting prototype
        </div>
      </div>

    </div>

    <!-- FOOTER -->

    <div class="footer">

      <span>
        Smart Attendance System — Draft Report
      </span>

      <span>
        Not valid for government or
        immigration submission
      </span>

    </div>

  </article>

</body>
</html>`;
}

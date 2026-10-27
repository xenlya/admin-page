
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFPage,
  type PDFFont,
} from 'pdf-lib';

import type {
  CombinedReportData,
} from './attendance-report-data';

type ReportType = 'academic' | 'compliance';

// A4 page measurements in PDF points
const W = 595.28;
const H = 841.89;
const LEFT = 85;
const RIGHT = 50;
const WIDTH = W - LEFT - RIGHT;
const BOTTOM = 82;

const RED = rgb(0.78, 0.06, 0.18);
const DARK = rgb(0.16, 0.17, 0.19);
const GREY = rgb(0.40, 0.42, 0.45);
const LIGHT = rgb(0.98, 0.91, 0.93);
const BORDER = rgb(0.76, 0.77, 0.79);
const WHITE = rgb(1, 1, 1);

// Convert unsupported Unicode characters to
// PDF-safe characters for standard Helvetica.
function clean(value: unknown): string {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[^\x20-\x7E]/g, '?');
}

function show(value: unknown): string {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 'N/A';
  }
  return clean(value);
}

function pct(value: number | null): string {
  return value === null || !Number.isFinite(value)
    ? 'N/A'
    : `${value.toFixed(2)}%`;
}

// Provisional classifications only.
// Not official university attendance rules.
function classification(value: number | null): string {
  if (value === null) return 'N/A';
  if (value === 0) return 'Nil';
  if (value >= 80) return 'Good';
  if (value >= 40) return 'Fair';
  return 'Poor';
}

// Wrap long text without cutting it off.
function wrap(
  text: unknown,
  font: PDFFont,
  size: number,
  width: number
): string[] {
  const words = show(text).split(/\s+/);
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;

    if (font.widthOfTextAtSize(candidate, size) <= width) {
      line = candidate;
      continue;
    }

    if (line) {
      lines.push(line);
      line = '';
    }

    for (const ch of word) {
      if (
        line &&
        font.widthOfTextAtSize(line + ch, size) > width
      ) {
        lines.push(line);
        line = ch;
      } else {
        line += ch;
      }
    }
  }

  if (line) lines.push(line);
  return lines.length ? lines : ['N/A'];
}

class LetterReport {
  private page!: PDFPage;
  private pages: PDFPage[] = [];
  private y = 0;

  constructor(
    private pdf: PDFDocument,
    private regular: PDFFont,
    private bold: PDFFont,
    private logo: Uint8Array | undefined,
    private type: ReportType,
    private studentId: string
  ) {}

  async start() {
    await this.newPage();
  }

  private async newPage() {
    this.page = this.pdf.addPage([W, H]);
    this.pages.push(this.page);

    // Red vertical stripe, matching print report.
    this.page.drawRectangle({
      x: 43,
      y: 80,
      width: 4,
      height: H - 255,
      color: RED,
    });

    // Draft badge
    this.page.drawRectangle({
      x: LEFT,
      y: H - 92,
      width: 180,
      height: 22,
      color: LIGHT,
      borderColor: RED,
      borderWidth: 0.7,
    });

    this.page.drawText(
      'DRAFT - NOT FOR OFFICIAL ISSUANCE',
      {
        x: LEFT + 7,
        y: H - 84,
        size: 7.5,
        font: this.bold,
        color: RED,
      }
    );

    // University logo: reuse the existing
    // lib/logo.png from the print report.
    if (this.logo) {
      try {
        const image = await this.pdf.embedPng(this.logo);
        const scale = Math.min(
          140 / image.width,
          65 / image.height
        );

        const iw = image.width * scale;
        const ih = image.height * scale;

        this.page.drawImage(image, {
          x: W - RIGHT - iw,
          y: H - 122,
          width: iw,
          height: ih,
        });
      } catch {
        // Report remains usable without the logo.
      }
    }

    this.y = H - 152;
  }

  private async reserve(height: number) {
    if (this.y - height < BOTTOM) {
      await this.newPage();
    }
  }

  private line(
    text: unknown,
    x: number,
    y: number,
    size = 9,
    bold = false,
    color = DARK
  ) {
    this.page.drawText(show(text), {
      x,
      y,
      size,
      font: bold ? this.bold : this.regular,
      color,
    });
  }

  async text(
    content: unknown,
    options: {
      bold?: boolean;
      size?: number;
      indent?: number;
      color?: typeof DARK;
      gap?: number;
    } = {}
  ) {
    const size = options.size ?? 9.5;
    const indent = options.indent ?? 0;
    const font = options.bold ? this.bold : this.regular;

    const lines = wrap(
      content,
      font,
      size,
      WIDTH - indent
    );

    const leading = size + 5;
    const needed =
      lines.length * leading + (options.gap ?? 10);

    await this.reserve(needed);

    for (const line of lines) {
      this.line(
        line,
        LEFT + indent,
        this.y,
        size,
        options.bold,
        options.color ?? DARK
      );
      this.y -= leading;
    }

    this.y -= options.gap ?? 10;
  }

  async heading(content: string) {
    await this.reserve(38);

    this.y -= 7;

    this.line(
      content.toUpperCase(),
      LEFT,
      this.y,
      10,
      true,
      RED
    );

    this.y -= 11;

    this.page.drawLine({
      start: { x: LEFT, y: this.y },
      end: { x: W - RIGHT, y: this.y },
      thickness: 0.7,
      color: BORDER,
    });

    this.y -= 22;
  }

  async field(label: string, value: unknown) {
    const labelWidth = 127;
    const colonX = LEFT + labelWidth;
    const valueX = colonX + 16;

    const lines = wrap(
      value,
      this.regular,
      9,
      WIDTH - labelWidth - 20
    );

    await this.reserve(lines.length * 13 + 8);

    this.line(label, LEFT + 12, this.y, 9, true);
    this.line(':', colonX, this.y, 9);

    for (const line of lines) {
      this.line(line, valueX, this.y, 9);
      this.y -= 13;
    }

    this.y -= 7;
  }

  async table(
    headers: string[],
    rows: string[][],
    widths: number[]
  ) {
    if (
      headers.length !== widths.length ||
      Math.abs(
        widths.reduce((a, b) => a + b, 0) - WIDTH
      ) > 0.1
    ) {
      throw new Error('Invalid PDF table widths.');
    }

    const headerH = 25;

    const drawHeader = () => {
      this.page.drawRectangle({
        x: LEFT,
        y: this.y - headerH + 7,
        width: WIDTH,
        height: headerH,
        color: LIGHT,
        borderColor: BORDER,
        borderWidth: 0.5,
      });

      let x = LEFT;

      headers.forEach((header, i) => {
        const headingLines = wrap(
          header,
          this.bold,
          7.7,
          widths[i] - 12
        ).slice(0, 2);

        headingLines.forEach((text, lineIndex) => {
          this.line(
            text,
            x + 6,
            this.y - lineIndex * 9,
            7.7,
            true,
            RED
          );
        });

        x += widths[i];
      });

      this.y -= headerH + 2;
    };

    await this.reserve(65);
    drawHeader();

    if (rows.length === 0) {
      rows = [
        ['No records available', ...headers.slice(1).map(() => '')]
      ];
    }

    for (const row of rows) {
      const cells = widths.map((width, i) =>
        wrap(row[i] ?? '', this.regular, 8, width - 12)
      );

      const maxLines = Math.max(
        1,
        ...cells.map(lines => lines.length)
      );

      const rowH = Math.max(25, maxLines * 11 + 12);

      if (this.y - rowH < BOTTOM) {
        await this.newPage();
        drawHeader();
      }

      this.page.drawRectangle({
        x: LEFT,
        y: this.y - rowH + 7,
        width: WIDTH,
        height: rowH,
        borderColor: BORDER,
        borderWidth: 0.5,
        color: WHITE,
      });

      let x = LEFT;

      cells.forEach((lines, i) => {
        lines.forEach((line, j) => {
          this.line(
            line,
            x + 6,
            this.y - j * 11,
            8
          );
        });

        x += widths[i];
      });

      this.y -= rowH;
    }

    this.y -= 18;
  }

  async opening(
    title: string,
    name: string,
    generatedBy: string
  ) {
    await this.text(
      'Ref: DRAFT / NOT ISSUED',
      { size: 9, gap: 4 }
    );

    await this.text(
      'Date: ' +
      new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      { size: 9, gap: 12 }
    );

    await this.text(
      'TO WHOM IT MAY CONCERN',
      { bold: true, size: 10, gap: 14 }
    );

    await this.text('Dear Sir/Madam,', { gap: 13 });

    await this.text(
      `${title.toUpperCase()} FOR ${name.toUpperCase()}`,
      { bold: true, size: 10, gap: 12 }
    );

    await this.text(
      'This document provides a draft summary for ' +
      'administrative demonstration and review. ' +
      'It is not a certified university record.',
      { gap: 16 }
    );

    await this.field('Student ID', this.studentId);
    await this.field('Prepared By', generatedBy);
  }

  async closing() {
    await this.text(
      'If there are any further queries, ' +
      'please contact the SE / Registrar Office.',
      { gap: 18 }
    );

    await this.text('Yours sincerely,', { gap: 18 });

    await this.text(
      'SE / Registrar Office (draft placeholder)',
      { size: 9, gap: 4 }
    );

    await this.text(
      'Unsigned demonstration document',
      { size: 8, color: GREY }
    );
  }

  finish() {
    this.pages.forEach((page, i) => {
      page.drawLine({
        start: { x: LEFT, y: 59 },
        end: { x: W - RIGHT, y: 59 },
        color: BORDER,
        thickness: 0.6,
      });

      page.drawText(
        'Smart Attendance System - Draft Report',
        {
          x: LEFT,
          y: 44,
          size: 7.2,
          font: this.regular,
          color: GREY,
        }
      );

      page.drawText(
        `Page ${i + 1} of ${this.pages.length}`,
        {
          x: W - RIGHT - 58,
          y: 44,
          size: 7.2,
          font: this.regular,
          color: GREY,
        }
      );

      page.drawText(
        'Not valid for government or immigration submission',
        {
          x: LEFT,
          y: 29,
          size: 7,
          font: this.bold,
          color: RED,
        }
      );
    });
  }
}

// -------------------------------
// ACADEMIC PDF
// -------------------------------

async function drawAcademic(
  report: LetterReport,
  data: CombinedReportData
) {
  const student = data.profile;

  await report.heading('Student Academic Information');

  await report.field('Student Name', student.fullName);
  await report.field('Programme', student.programme.name);
  await report.field('Programme Code', student.programme.code);
  await report.field('Faculty', student.faculty);
  await report.field('Campus', student.campus);
  await report.field('Email', student.email);
  await report.field('Student Type', student.studentType);
  await report.field('Year of Study', student.yearOfStudy);
  await report.field('Current Semester', student.semester);
  await report.field('Academic Status', student.academicStatus);

  await report.heading('Semester Attendance Summary');

  await report.table(
    ['Semester / Intake', 'Attendance', 'Percentage'],
    data.semesters.map(s => [
      `${s.label} / ${s.intake}`,
      classification(s.percentage),
      pct(s.percentage),
    ]),
    [225, 120, WIDTH - 345]
  );

  await report.heading('Attendance Classification Key');

  await report.table(
    ['Classification', 'Percentage Range'],
    [
      ['Good', '80 - 100%'],
      ['Fair', '40 - below 80%'],
      ['Poor', 'Above 0 - below 40%'],
      ['Nil', '0%'],
    ],
    [180, WIDTH - 180]
  );

  await report.heading('Enrolled Units');

  await report.table(
    ['Unit Code', 'Unit Name', 'Semester'],
    student.enrolments.map(unit => [
      unit.code,
      unit.name,
      unit.semester,
    ]),
    [95, 240, WIDTH - 335]
  );

  await report.heading('Source and Verification');

  await report.field('Attendance Source', data.source);
  await report.field('Profile Source', data.profileSource);

  await report.text(
    'Attendance values and student profile information ' +
    'may be synthetic. Classification thresholds are ' +
    'provisional. The enrolled-unit table is not proof ' +
    'of unit-level attendance. This academic report ' +
    'cannot be used for official certification.',
    { color: RED }
  );

  await report.closing();
}

// -------------------------------
// COMPLIANCE PDF
// -------------------------------

async function drawCompliance(
  report: LetterReport,
  data: CombinedReportData
) {
  const student = data.profile;
  const visa = student.visa;

  await report.heading('Student Information');

  await report.field('Student Name', student.fullName);
  await report.field('Programme', student.programme.name);
  await report.field('Student Type', student.studentType);
  await report.field('Academic Status', student.academicStatus);
  await report.field('Campus', student.campus);

  await report.heading('Visa Profile Information');

  await report.field(
    'Visa Applicable',
    visa.applicable ? 'Yes (Demo)' : 'No (Demo)'
  );

  await report.field('Visa Status', visa.status);
  await report.field('Expiry Date', visa.expiryDate);

  await report.field(
    'Review Required',
    visa.reviewRequired ? 'Yes (Demo)' : 'No (Demo)'
  );

  await report.field(
    'Verification',
    'Emulated - Not verified'
  );

  await report.heading('Semester Attendance Evidence');

  await report.table(
    ['Semester', 'Intake', 'Attendance'],
    data.semesters.map(s => [
      s.label,
      s.intake,
      pct(s.percentage),
    ]),
    [170, 160, WIDTH - 330]
  );

  await report.heading('Compliance Review');

  await report.field(
    'Review Outcome',
    'NOT ASSESSED'
  );

  await report.field(
    'Official Approval',
    'Not issued'
  );

  await report.field(
    'Attendance Source',
    data.source
  );

  await report.field(
    'Profile Source',
    data.profileSource
  );

  await report.text(
    'The visa data and review flags are emulated. ' +
    'No official immigration eligibility decision, ' +
    'visa assessment or attendance compliance ' +
    'determination has been made.',
    { color: RED }
  );

  await report.text(
    visa.note ||
    'Additional visa information is not available.'
  );

  await report.heading('Administrative Notice');

  await report.text(
    'This document is provided solely for FYP ' +
    'demonstration and manual review. It must ' +
    'not be used for Immigration Department ' +
    'submission, official university clearance, ' +
    'visa renewal or government certification.',
    { color: RED }
  );

  await report.closing();
}

// -------------------------------
// EXISTING API ENTRY POINT
// -------------------------------

export async function generateAttendancePdf(
  data: CombinedReportData,
  type: ReportType,
  generatedBy: string
): Promise<Uint8Array> {
  if (type !== 'academic' && type !== 'compliance') {
    throw new Error('Invalid report type.');
  }

  const pdf = await PDFDocument.create();

  const regular = await pdf.embedFont(
    StandardFonts.Helvetica
  );

  const bold = await pdf.embedFont(
    StandardFonts.HelveticaBold
  );

  // The same logo already used by the
  // browser print report.
  let logo: Uint8Array | undefined;

  try {
    const file = await readFile(
      path.join(process.cwd(), 'lib', 'logo.png')
    );
    logo = new Uint8Array(file);
  } catch {
    logo = undefined;
  }

  const report = new LetterReport(
    pdf,
    regular,
    bold,
    logo,
    type,
    data.profile.sisId
  );

  await report.start();

  await report.opening(
    type === 'academic'
      ? 'Academic Attendance Report'
      : 'Visa and Compliance Review Report',
    data.profile.fullName,
    generatedBy
  );

  if (type === 'academic') {
    await drawAcademic(report, data);
  } else {
    await drawCompliance(report, data);
  }

  report.finish();

  pdf.setTitle(
    type === 'academic'
      ? 'Academic Attendance Report - Draft'
      : 'Visa Compliance Review Report - Draft'
  );

  pdf.setCreator('Smart Attendance FYP Admin Portal');
  pdf.setSubject('Demonstration reporting document');

  return pdf.save();
}

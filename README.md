# Smart Academic Attendance — Admin Portal (refined complete project)

This ZIP is the **whole uploaded Next.js project**, preserving the Swinburne-themed `/dashboard` design, NextAuth/Entra staff login, n8n Student Profile Emulator and n8n Semester Attendance Emulator. The QR check-in Data Table is a separate prototype and **is not required** to populate this dashboard.

## What's included

- Protected Microsoft Entra staff login with `ADMIN_ALLOWED_EMAILS` allowlist.
- Student lookup by SIS ID, profile, enrolments and semester attendance.
- **Academic attendance PDF**: real downloadable, multi-page A4 PDF generated on the server, no browser print dialog needed.
- **Compliance review PDF**: real downloadable A4 PDF, explicitly **NOT ASSESSED**; no invented eligibility or official certificate.
- **CSV**: downloadable semester attendance table with provenance labels and Excel formula injection protection.
- Existing **print-ready HTML preview** preserved.
- n8n integration remains server-side; no replacement of existing workflows or webhook paths.
- No new npm dependencies.

## Quick start (Windows PowerShell)

```powershell
cd "C:\path\to\fyp-admin-portal"
Copy-Item .env.example .env.local
notepad .env.local
npm ci
npm run preflight
npm run build
npm run dev
```

Open `http://localhost:3000/dashboard` and sign in with an allowed Entra account. Search for `104404156` **only if this ID exists in your n8n emulator**. After results load, use the Generate Report menu to scroll to the reporting actions.

### Required `.env.local`

`NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`, `ADMIN_ALLOWED_EMAILS`, `SEMESTER_WEBHOOK_URL`, `STUDENT_PROFILE_WEBHOOK_URL`.

The ZIP includes `.env.example` with examples. Your real `.env.local` is intentionally excluded; **copy your working local environment values** into the new project's `.env.local`. Never upload or commit secrets.

Entra Web redirect URI: `http://localhost:3000/api/auth/callback/azure-ad`.

**Important:** This uploaded project uses Next.js **14.x** and NextAuth **4.x**, not the separate Next.js 16 portal discussed earlier. It retains its compatible `runtime` and `dynamic` route exports. Do not enable Next.js 16 `cacheComponents` or copy Next.js 16 code/configuration into it without a deliberate migration.

## Existing n8n integration

The app calls **two existing webhooks**, both from the Next.js server:

1. `SEMESTER_WEBHOOK_URL` — e.g. `/webhook/attendance-semesters-demo?sis_id=104404156`. Expected: `{success:true, student:{sisId:"104404156"}, semesters:[...], source:"DEMO_SYNTHETIC", isSynthetic:true}`.
2. `STUDENT_PROFILE_WEBHOOK_URL` — e.g. `/webhook/student-profile-demo?sis_id=104404156`. Expected: `{success:true, student:{sisId:"104404156", fullName, programme:{name,code}, enrolments:[], isSynthetic:true, ...}, isSynthetic:true}`.

The two responses must refer to the same SIS ID. If the semester endpoint returns an error or no data, check its active workflow, exact URL, response shape and n8n Executions. The admin `fyp_demo_checkins` table is **not** queried by this project.

**Do not overwrite your existing n8n workflows** with the unrelated `fyp-admin-records-v2` workflow. The upload's actual source code is the source of truth here.

If you later secure these public emulator webhooks with n8n Header Auth, update `fetchSemester` and `fetchEmulatedStudentProfile` to send the required server-only header and store the key in `.env.local`. The Admin Portal's Entra login does not secure publicly reachable n8n webhook URLs.

## Routes

| Route | Output |
| --- | --- |
| `/dashboard` | Existing themed admin dashboard |
| `/api/attendance?sis_id=...` | Combined semester + emulated profile JSON |
| `/api/report?sis_id=...` | Existing HTML print-ready draft |
| `/api/report/pdf?sis_id=...&type=academic` | Downloadable academic PDF |
| `/api/report/pdf?sis_id=...&type=compliance` | Downloadable compliance review PDF — NOT ASSESSED |
| `/api/report/csv?sis_id=...` | Downloadable academic CSV |

All data/report endpoints require the current allowlisted admin session. Every export uses `private, no-store`.

## Validation

```powershell
npm ci
npm run preflight
npm run typecheck
npm run build
npm run dev
```

1. Verify Entra sign-in with an allowlisted test user.
2. Search an emulator SIS ID. Confirm student name, enrolments and semester percentages appear.
3. Click **Academic PDF** and open the resulting `.pdf` (not HTML).
4. Click **Compliance PDF** and verify **NOT ASSESSED**, synthetic source labels and no certification.
5. Download CSV; confirm it contains the same semester records and source labels.
6. Verify the original **Print-ready preview** still opens.
7. Test unauthenticated `/api/report/pdf?...` in a private browser session: must return HTTP 401.
8. Test a mismatched SIS ID or unavailable emulator: must show an error, not a fabricated student record.

## Scope / security limits

This is a **FYP demonstration**, not a production Registrar service. No verified Qwickly semester percentages, official student/visa records, university-approved compliance thresholds, signature, stamp, issuance workflow or audit log are implemented. Even if a response is labelled Qwickly-verified, independent university validation is required before official use.

The PDF engine uses built-in PDF Helvetica fonts and safely substitutes unsupported Unicode characters; unusual non-Latin names may display with replacement characters. For multilingual official reporting, use an embedded Unicode font and an approved report template.

## Packaging / verification

The ZIP intentionally omits `node_modules`, `.next`, `.git`, `.env.local`, and other credentials. Run `npm ci` after extracting. The PDF generator was exercised using synthetic sample data and both PDFs were parsed successfully; the complete Next.js build and live n8n connectivity could not be verified in this environment because npm registry access was unavailable.

## Differences from previous discussion

The previous `/admin` Next.js 16 prototype and the uploaded `/dashboard` Next.js 14 project are **distinct codebases**. This deliverable updates **the uploaded `/dashboard` project only**, without replacing its layout or inventing a new n8n workflow.

---

## Client meeting update — Multi-page administrative workspace (October 2026)

This revision preserves the existing NextAuth Microsoft Entra sign-in, student-profile/semester n8n emulator integration, PDF generation and existing API URLs, but replaces the single-page admin dashboard interface with **dedicated pages**:

| Page | Function |
| --- | --- |
| `/dashboard` | Overview of the administrative workflow and weekly class/lab scoring rule |
| `/students` | Batch search up to 25 numeric SIS IDs, separated by commas, spaces or lines |
| `/students/{sisId}` | Full student profile; expand semester, then unit to see 12 weekly Class/Lab rows |
| `/attendance` | Multi-student semester attendance comparison; link to the detailed student profile |
| `/visa` | Emulated visa and compliance information, clearly marked demonstration only |
| `/reports` | Multiple students, Excel (.xlsx) export, existing individual draft academic and compliance PDFs |
| `/settings` | Data sources, security, and integration limitations |

### Added endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/students/batch` | Requires signed-in allowlisted admin. Body `{ "ids": ["104404156", "..."] }`, maximum 25 unique IDs; per-student errors do not hide successful results |
| `POST` | `/api/export/excel` | Same request format/authorization; returns a real `.xlsx` workbook with 6 sheets: Students, Semesters, Units, Weekly Checks, Errors, Read Me |
| `GET` | `/api/attendance?sis_id=...` | Existing endpoint, now also returns a clearly labelled `unitBreakdown` field for the demo drill-down; existing response fields unchanged |

### Weekly score rule — **illustrative, not from Qwickly**

Each demonstration week has one Class and one Lab. Each contributes 0.5:

- Class Present and Lab Present → score `1.0` (100%).
- Exactly one Present → score `0.5` (50%).
- Neither Present → score `0.0` (0%).

A unit's *illustrative* attendance percentage is its mean weekly score × 100 across the 12 demo weeks. These statuses come from stable emulator fixtures, **not actual per-session Qwickly attendance**. The student profile emulator supplies unit names. The semester summary comes independently from the existing n8n semester webhook and is **not calculated from these demo unit scores**. The UI, Excel Read Me and source columns all label the limitation to avoid false compliance conclusions.

If the emulator does not identify a semester for an enrolment, the UI can display the current enrolment against only the most recent semester with a **demo mapping** label; earlier semesters are left without unit detail rather than fabricating them.

### Excel columns for manual double checks

The workbook uses plain column headers such as `Student ID`, `Student Name`, `Semester`, `Unit Code`, `Week`, `Class`, `Lab`, `Class Score`, `Lab Score`, `Week Score`, `Week %`, and `Data Source`. There is also an **Errors** sheet and a **Read Me** sheet explaining the scoring rules and data provenance. Student IDs are stored as text to preserve identifiers; all spreadsheet strings are literal Excel inline strings, not formulas.

### Existing setup stays the same

Create `.env.local` from `.env.example`, carry over your own Microsoft Entra / NextAuth and n8n emulator configuration, then run `npm ci`, `npm run typecheck`, `npm run build`, and `npm run dev`. For testing, sign in with an allowlisted account and batch-search SIS IDs that exist in your n8n emulator. The application does not create or update official Qwickly attendance or visa records. Do not commit `.env.local` to source control.

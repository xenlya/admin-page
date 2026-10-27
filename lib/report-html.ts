import type { SemesterResponse } from './semester';
import { pct } from './semester';
const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
export function renderReportHtml(data: SemesterResponse, generatedBy: string): string {
  const date = new Date().toLocaleDateString('en-MY', { day: '2-digit', month: 'long', year: 'numeric' });
  const rows = data.semesters.map(s => `<tr><td>${esc(s.label)}</td><td>${esc(s.intake)}</td><td>${esc(pct(s.percentage))}</td><td>${s.source === 'DEMO_SYNTHETIC' ? 'Synthetic fixture' : 'Qwickly-verified source'}</td></tr>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Attendance Report Preview</title><style>
  @page{size:A4;margin:18mm}body{font:11pt/1.5 Arial,Helvetica,sans-serif;color:#111;max-width:900px;margin:32px auto;padding:20px}header{text-align:right;margin-bottom:40px}.logo{border:1px dashed #888;display:inline-block;padding:18px;color:#666;font-size:10pt}.ref{margin-top:20px;text-align:left}.title{margin:25px 0;font-weight:bold;text-transform:uppercase}table{border-collapse:collapse;width:100%;margin:24px 0}th,td{border:1px solid #222;padding:9px;text-align:left}th{background:#eee}.notice{border:2px solid #555;padding:14px;margin:20px 0;font-weight:bold}.closing{margin-top:40px}.actions{display:flex;gap:10px;margin-bottom:28px}button{padding:11px 16px;cursor:pointer}.footer{margin-top:60px;border-top:1px solid #888;padding-top:8px;font-size:9pt}@media print{body{margin:0;padding:0}.actions{display:none}.notice{break-inside:avoid}}
  </style></head><body><div class="actions"><button onclick="window.print()">Print / Save as PDF</button><button onclick="window.close()">Close preview</button></div>
  <header><div class="logo">UNIVERSITY LOGO PLACEHOLDER</div><div class="ref"><strong>Generated:</strong> ${esc(date)}<br><strong>Prepared by:</strong> ${esc(generatedBy)}<br><strong>Document:</strong> ADMINISTRATIVE DRAFT — NOT ISSUED</div></header>
  <p><strong>TO WHOM IT MAY CONCERN</strong></p><p class="title">ATTENDANCE REPORT PREVIEW — STUDENT ${esc(data.student.sisId)}</p>
  <table><tr><td><strong>Student ID</strong></td><td>${esc(data.student.sisId)}</td></tr><tr><td><strong>Data source</strong></td><td>${esc(data.source)}</td></tr></table>
  <p>The semester/intake attendance information currently available for review is shown below.</p>
  <table><thead><tr><th>Semester</th><th>Intake</th><th>Attendance</th><th>Source</th></tr></thead><tbody>${rows || '<tr><td colspan="4">No semester records available.</td></tr>'}</tbody></table>
  <div class="notice">${data.isSynthetic ? 'DEMONSTRATION ONLY: All attendance percentages in this document are synthetic. Not suitable for Immigration, government submission, or official certification.' : 'ADMINISTRATIVE DRAFT: Requires SE/Registrar Office review and authorisation before issuance. No signature or stamp is applied.'}</div>
  <p class="closing">This report preview is generated for authorised SE/Registrar Office review only. It is not an issued or certified university document.</p>
  <div class="footer">Smart Attendance System • Administrator reporting prototype</div></body></html>`;
}

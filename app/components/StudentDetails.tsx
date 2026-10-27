 'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { CombinedReportData } from '../../lib/attendance-report-data';
import type { SemesterUnits } from '../../lib/unit-attendance';
import { pct } from '../../lib/semester';
import styles from './portal.module.css';
type Response = CombinedReportData & {unitBreakdown:SemesterUnits[]};
export default function StudentDetails({sisId}:{sisId:string}) {
  const [data,setData] = useState<Response|null>(null);
  const [error,setError] = useState('');
  const [loading,setLoading] = useState(true);
  useEffect(()=>{let live=true;(async()=>{
    setLoading(true);setError('');
    try {const r=await fetch(`/api/attendance?sis_id=${encodeURIComponent(sisId)}`,{cache:'no-store'});
      const j=await r.json();if(!r.ok)throw new Error(j.error||'Student lookup failed');
      if(live)setData(j as Response);
    }catch(e){if(live)setError(e instanceof Error?e.message:'Student unavailable');}
    finally{if(live)setLoading(false);}
  })();return()=>{live=false;};},[sisId]);
  if(loading)return <div className={styles.panel}>Loading student profile and semesters…</div>;
  if(error)return <div className={styles.panel}><p className={styles.error}>{error}</p><Link className={styles.textLink} href="/students">← Back to search</Link></div>;
  if(!data)return null;
  const fields=[['Student ID',data.profile.sisId],['Full name',data.profile.fullName],['Email',data.profile.email],
    ['Programme',data.profile.programme.name],['Programme code',data.profile.programme.code],
    ['Year',data.profile.yearOfStudy],['Faculty',data.profile.faculty],['Campus',data.profile.campus],
    ['Student type',data.profile.studentType],['Academic status',data.profile.academicStatus]];
  return <>
    <div className={styles.row} style={{marginBottom:12}}><Link href="/students" className={styles.textLink}>← Student Search</Link>
      <Link href={`/attendance?ids=${sisId}`} className={styles.textLink}>Attendance view</Link>
      <Link href={`/visa?ids=${sisId}`} className={styles.textLink}>Visa view</Link>
      <Link href={`/reports?ids=${sisId}`} className={styles.textLink}>Reports</Link></div>
    <section className={styles.panel}><div className={styles.panelHead}><div><h2>{data.profile.fullName}</h2><p>Student ID {data.profile.sisId} · Emulated student profile</p></div>
      <span className={styles.badge}>Synthetic student data</span></div>
      <div className={styles.detailGrid}>{fields.map(([label,val])=><div key={label} className={styles.detailField}><small>{label}</small><strong>{val||'N/A'}</strong></div>)}</div>
    </section>
    <section className={styles.panel}><div className={styles.panelHead}><div><h2>Semester attendance</h2><p>Click any semester to expand enrolled units. Click a unit for weekly Class and Lab breakdown.</p></div><span className={styles.badge}>{data.semesters.length} semesters</span></div>
      {data.semesters.length===0?<p>No semester results from n8n.</p>:data.semesters.map((sem,index)=>{
        const breakdown=data.unitBreakdown?.find(x=>x.semesterId===sem.semesterId);
        return <details key={sem.semesterId} className={styles.accordion} open={index===data.semesters.length-1}>
          <summary><span><strong>{sem.label}</strong><div className={styles.micro}>{sem.intake} · {sem.source==='DEMO_SYNTHETIC'?'Demo semester result':'Qwickly-verified semester result'}</div></span><span><strong style={{color:'#b10e2a'}}>{pct(sem.percentage)}</strong> &nbsp; ▾</span></summary>
          <div className={styles.accordionInner}>
            <p className={styles.footnote}>The semester percentage above comes from the configured n8n semester workflow. Unit scores below are separate emulated examples, not its breakdown.</p>
            {!breakdown||breakdown.units.length===0?<div className={styles.empty}>No enrolments mapped to this semester in the available emulator data. No unit attendance has been invented.</div>:
              breakdown.units.map(unit=><details key={unit.code} className={styles.subAccordion}>
                <summary><span><strong>{unit.code}</strong> · {unit.name}<div className={styles.micro}>{unit.semesterAssignment==='DEMO_CURRENT_ENROLMENT_ASSIGNMENT'?'Current enrolment placed in latest semester for demonstration':'Emulated semester enrolment matched'} · Demo unit data</div></span>
                  <span><strong>{unit.percentage.toFixed(2)}%</strong> &nbsp; ▾</span></summary>
                <div style={{padding:14}}><div className={styles.formula}>Per week: Class + Lab are each worth 0.5. Both Present = 1.0; one Present = 0.5; both Absent = 0.0. Unit % = average of weekly scores × 100.</div>
                  <div className={styles.tableWrap} style={{marginTop:13}}><table className={styles.table}><thead><tr><th>Week</th><th>Class</th><th>Lab</th><th>Class Score</th><th>Lab Score</th><th>Week Score</th><th>Week %</th></tr></thead><tbody>
                    {unit.weeks.map(w=><tr key={w.week}><td>{w.week}</td>
                      <td><span className={`${styles.badge} ${w.classScore?styles.greenBadge:styles.redBadge}`}>{w.classStatus}</span></td>
                      <td><span className={`${styles.badge} ${w.labScore?styles.greenBadge:styles.redBadge}`}>{w.labStatus}</span></td>
                      <td>{w.classScore}</td><td>{w.labScore}</td><td><strong>{w.weekScore.toFixed(1)}</strong></td><td>{w.weekPercent}%</td></tr>)}
                  </tbody></table></div><p className={styles.footnote}>These 12-week results are stable illustrative fixtures based on the student, unit and week. They are not pulled from Qwickly.</p></div>
              </details>)}
          </div>
        </details>;
      })}
    </section>
    <section className={styles.panel}><div className={styles.panelHead}><div><h2>Visa & compliance context</h2><p>Emulated student profile; not an immigration assessment.</p></div><span className={styles.badge}>Demo</span></div>
      <div className={styles.detailGrid}>{[
        ['Applicable',data.profile.visa?.applicable?'Yes':'No'],
        ['Status',data.profile.visa?.status||'Not available'],
        ['Expiry date',data.profile.visa?.expiryDate||'Not available'],
        ['Review required',data.profile.visa?.reviewRequired?'Yes':'No'],
      ].map(([k,v])=><div key={k} className={styles.detailField}><small>{k}</small><strong>{v}</strong></div>)}</div>
      <p className={styles.footnote}>{data.profile.visa?.note||'Emulated data only.'}</p>
    </section>
    <section className={styles.panel}><div className={styles.panelHead}><div><h2>Student exports</h2><p>Existing report generators are unchanged and remain labelled draft/demo.</p></div></div>
      <div className={styles.actions}>
        <a target="_blank" rel="noreferrer" className={styles.button} href={`/api/report/pdf?sis_id=${encodeURIComponent(sisId)}&type=academic`}>Academic PDF ↗</a>
        <a target="_blank" rel="noreferrer" className={`${styles.button} ${styles.secondaryButton}`} href={`/api/report/pdf?sis_id=${encodeURIComponent(sisId)}&type=compliance`}>Compliance PDF ↗</a>
        <a target="_blank" rel="noreferrer" className={`${styles.button} ${styles.secondaryButton}`} href={`/api/report?sis_id=${encodeURIComponent(sisId)}`}>Print preview ↗</a>
      </div>
    </section>
  </>;
}

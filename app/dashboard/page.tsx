import Link from 'next/link';
import AuthorizedPage from '../components/AuthorizedPage';
import styles from '../components/portal.module.css';
export const dynamic = 'force-dynamic';
export default function Dashboard() {
  return <AuthorizedPage title="Overview" subtitle="A dedicated workspace for searching students, reviewing attendance, checking visa context and exporting reports.">
    <div className={styles.kpis}>
      <div className={`${styles.kpi} ${styles.redKpi}`}><span>Student Search</span><strong>Batch</strong><small>Up to 25 SIS IDs per lookup</small></div>
      <div className={styles.kpi}><span>Semester → Unit</span><strong>Drill-down</strong><small>Clickable semester and unit details</small></div>
      <div className={styles.kpi}><span>Weekly rule</span><strong>0 / 0.5 / 1</strong><small>Class + Lab attendance example</small></div>
      <div className={styles.kpi}><span>Audit exports</span><strong>Excel</strong><small>Simple, readable column names</small></div>
    </div>
    <section className={styles.panel}><h2>Select an administrative function</h2><p>Each function has its own page, as requested in the client feedback.</p>
      <div className={styles.twoCols}>
        {[
          ['/students','Student Search','Search multiple SIS IDs, view results, open a student profile.'],
          ['/attendance','Attendance Records','Compare semester percentages and inspect detailed units and weeks.'],
          ['/visa','Visa & Compliance','View provisional emulated visa details by student.'],
          ['/reports','Reports & Excel','Export audit-friendly Excel, PDF drafts and printable reports.'],
        ].map(([href,name,desc])=><Link href={href} key={href} className={styles.panel} style={{margin:0,display:'block'}}>
          <h3 style={{color:'#c8102e'}}>{name} →</h3><p style={{margin:0}}>{desc}</p></Link>)}
      </div>
    </section>
    <section className={styles.panel}><h2>How the attendance calculation works</h2>
      <p>For an illustrative weekly unit with one Class and one Lab, each session contributes half of the week's possible credit.</p>
      <div className={styles.formula}>Class present + Lab present = 1.0 &nbsp; | &nbsp; Exactly one present = 0.5 &nbsp; | &nbsp; Both absent = 0.0</div>
      <p className={styles.footnote}>The weekly fixture is demonstration data only. It does not change the independent semester percentages returned by n8n and is not a live Qwickly attendance calculation.</p>
    </section>
  </AuthorizedPage>;
}

import AuthorizedPage from '../components/AuthorizedPage';
import styles from '../components/portal.module.css';
export const dynamic = 'force-dynamic';
export default function Settings(){
  return <AuthorizedPage title="Settings" subtitle="Data sources, access control and prototype limitations.">
    <section className={styles.panel}><h2>Integration status</h2><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Component</th><th>Current Source</th><th>Status</th></tr></thead><tbody>
      <tr><td>Admin login</td><td>Microsoft Entra / NextAuth with email allowlist</td><td><span className={styles.greenBadge}>Configured by administrator</span></td></tr>
      <tr><td>Student Profile</td><td>n8n Student Profile Emulator</td><td><span className={styles.badge}>Synthetic data</span></td></tr>
      <tr><td>Semester Attendance</td><td>Configured n8n semester webhook</td><td><span className={styles.badge}>Confirm response provenance</span></td></tr>
      <tr><td>Unit / Weekly breakdown</td><td>Stable demo fixture derived from emulator enrolments</td><td><span className={styles.badge}>Not Qwickly records</span></td></tr>
      <tr><td>PDF Reports</td><td>Existing server-side PDF generation</td><td><span className={styles.badge}>Draft only</span></td></tr>
      <tr><td>Excel Export</td><td>Batch response, semester data and demo Class/Lab weeks</td><td><span className={styles.badge}>Audit prototype</span></td></tr>
    </tbody></table></div></section>
    <section className={styles.panel}><h2>Access and data handling</h2><p>All student lookups and report endpoints require an allowlisted administrative session. Credentials must stay in the server environment, not in browser code or downloaded ZIP files. Access to the upstream n8n emulator webhook should be restricted separately.</p>
      <div className={styles.formula}>The portal does not create or update official Qwickly attendance or issue official visa compliance determinations.</div>
    </section>
  </AuthorizedPage>;
}

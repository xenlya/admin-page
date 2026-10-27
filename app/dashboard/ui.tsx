
'use client';

import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { signOut } from 'next-auth/react';

import type {
  CombinedReportData,
} from '../../lib/attendance-report-data';

import { pct } from '../../lib/semester';
import styles from './dashboard.module.css';

type IconName =
  | 'dashboard'
  | 'search'
  | 'file'
  | 'users'
  | 'book'
  | 'chart'
  | 'logout'
  | 'arrow'
  | 'check'
  | 'alert';

function Icon({
  name,
  size = 20,
}: {
  name: IconName;
  size?: number;
}) {
  const paths: Record<IconName, React.ReactNode> = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M8 13h8M8 17h8" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5v1" />
      </>
    ),
    book: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      </>
    ),
    chart: (
      <>
        <path d="M3 3v18h18" />
        <path d="m7 16 4-5 4 3 5-8" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5M21 12H9" />
      </>
    ),
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    alert: (
      <>
        <path d="m12 3 10 18H2L12 3Z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  icon,
  accent = false,
  delay = 0,
}: {
  label: string;
  value: string | number;
  subtitle: string;
  icon: IconName;
  accent?: boolean;
  delay?: number;
}) {
  return (
    <article
      className={`${styles.statCard} ${
        accent ? styles.statAccent : ''
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={styles.statTop}>
        <span className={styles.statLabel}>{label}</span>
        <span className={styles.statIcon}>
          <Icon name={icon} size={20} />
        </span>
      </div>

      <div className={styles.statValue}>{value}</div>
      <div className={styles.statSubtitle}>{subtitle}</div>
    </article>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className={styles.detail}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>
        {value === null || value === undefined || value === ''
          ? 'N/A'
          : value}
      </span>
    </div>
  );
}

export default function DashboardClient({
  email,
}: {
  email: string;
}) {
  const [sisId, setSisId] = useState('');
  const [data, setData] =
    useState<CombinedReportData | null>(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLElement>(null);

  const firstLetter = email.charAt(0).toUpperCase();

  const semesters = data?.semesters ?? [];

  const availableRecords = semesters.filter(
    s => s.percentage !== null
  ).length;

  const unavailableRecords = semesters.filter(
    s => s.percentage === null
  ).length;

  const enrolments = data?.profile.enrolments ?? [];

  async function searchStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const id = sisId.trim();

    setError('');
    setData(null);
    setLoading(true);

    try {
      const response = await fetch(
        `/api/attendance?sis_id=${encodeURIComponent(id)}`,
        { cache: 'no-store' }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || 'Unable to retrieve student data.'
        );
      }

      if (
        !result.profile ||
        !Array.isArray(result.semesters)
      ) {
        throw new Error('Unexpected API response structure.');
      }

      setData(result as CombinedReportData);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred.'
      );
    } finally {
      setLoading(false);
    }
  }

  function openReport() {
    if (!data) return;

    window.open(
      `/api/report?sis_id=${encodeURIComponent(
        data.profile.sisId
      )}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  function goToReports() {
    setMenuOpen(false);
    if (!data) { focusSearch(); return; }
    reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function openDownload(format: 'academic' | 'compliance' | 'csv') {
    if (!data) return;
    const id = encodeURIComponent(data.profile.sisId);
    const endpoint = format === 'csv'
      ? `/api/report/csv?sis_id=${id}`
      : `/api/report/pdf?sis_id=${id}&type=${format}`;
    window.open(endpoint, '_blank', 'noopener,noreferrer');
  }

  function focusSearch() {
    setMenuOpen(false);
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }

  function viewResults() {
    setMenuOpen(false);

    if (data) {
      resultsRef.current?.scrollIntoView({
        behavior: 'smooth',
      });
    } else {
      focusSearch();
    }
  }

  return (
    <div className={styles.app}>
      {/* SIDEBAR */}
      <aside
        className={`${styles.sidebar} ${
          menuOpen ? styles.sidebarOpen : ''
        }`}
      >
        <div className={styles.brand}>
          <div className={styles.brandMark}>S</div>

          <div>
            <div className={styles.brandName}>SWINBURNE</div>
            <div className={styles.brandSub}>
              SARAWAK CAMPUS
            </div>
          </div>
        </div>

        <div className={styles.sidebarDivider} />

        <div className={styles.navCaption}>WORKSPACE</div>

        <nav className={styles.navigation}>
          <button
            type="button"
            className={`${styles.navItem} ${styles.navActive}`}
            onClick={viewResults}
          >
            <Icon name="dashboard" size={19} />
            <span>Dashboard</span>
            <span className={styles.activeDot} />
          </button>

          <button
            type="button"
            className={styles.navItem}
            onClick={focusSearch}
          >
            <Icon name="search" size={19} />
            <span>Student Lookup</span>
          </button>

          <button
            type="button"
            className={styles.navItem}
            onClick={viewResults}
          >
            <Icon name="chart" size={19} />
            <span>Attendance Records</span>
          </button>

          <button
            type="button"
            className={styles.navItem}
            onClick={goToReports}
          >
            <Icon name="file" size={19} />
            <span>Generate Report</span>
          </button>
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.systemCard}>
            <div className={styles.systemCardGlow} />
            <div className={styles.systemCardTitle}>
              Academic Reporting
            </div>
            <p>
              Student attendance monitoring and
              reporting prototype.
            </p>
            <span className={styles.systemStatus}>
              <span className={styles.statusPulse} />
              DEMO ENVIRONMENT
            </span>
          </div>

          <button
            type="button"
            className={styles.signOut}
            onClick={() =>
              signOut({ callbackUrl: '/login' })
            }
          >
            <Icon name="logout" size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {menuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className={styles.overlay}
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* MAIN CONTENT */}
      <div className={styles.mainArea}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              type="button"
              className={styles.mobileMenu}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
            >
              ☰
            </button>

            <div className={styles.breadcrumb}>
              <span>Administration</span>
              <span className={styles.breadcrumbSlash}>/</span>
              <strong>Dashboard</strong>
            </div>
          </div>

          <div className={styles.topbarRight}>
            <span className={styles.environmentBadge}>
              <span className={styles.badgeDot} />
              Prototype
            </span>

            <div className={styles.userProfile}>
              <div className={styles.userText}>
                <strong>Administrator</strong>
                <small>{email}</small>
              </div>

              <div className={styles.avatar}>
                {firstLetter}
              </div>
            </div>
          </div>
        </header>

        <main className={styles.content}>
          {/* PAGE INTRO */}
          <section className={styles.pageIntro}>
            <div className={styles.introText}>
              <div className={styles.eyebrow}>
                ACADEMIC ADMINISTRATION
              </div>

              <h1>
                Attendance <span>Dashboard.</span>
              </h1>

              <p>
                Search student records, review semester
                attendance, and prepare draft reports
                from one central workspace.
              </p>
            </div>

            <div className={styles.introDecoration}>
              <div className={styles.decoCircleOne} />
              <div className={styles.decoCircleTwo} />
              <div className={styles.decoSymbol}>S</div>
            </div>
          </section>

          {/* DASHBOARD STATS */}
          <div className={styles.statsGrid}>
            <StatCard
              label="Selected Student"
              value={data ? '1' : '—'}
              subtitle={
                data
                  ? 'Student record loaded'
                  : 'Awaiting student search'
              }
              icon="users"
              accent
              delay={80}
            />

            <StatCard
              label="Semester Records"
              value={data ? semesters.length : '—'}
              subtitle="Records returned by n8n"
              icon="chart"
              delay={160}
            />

            <StatCard
              label="Available Results"
              value={data ? availableRecords : '—'}
              subtitle="Semesters with percentages"
              icon="check"
              delay={240}
            />

            <StatCard
              label="Enrolled Units"
              value={data ? enrolments.length : '—'}
              subtitle="From Student Profile Emulator"
              icon="book"
              delay={320}
            />
          </div>

          {/* SEARCH SECTION */}
          <section className={styles.searchPanel}>
            <div className={styles.panelHeading}>
              <div className={styles.headingIcon}>
                <Icon name="search" size={21} />
              </div>

              <div>
                <h2>Student Lookup</h2>
                <p>
                  Retrieve a student profile and
                  attendance history using their SIS ID.
                </p>
              </div>
            </div>

            <form
              className={styles.searchForm}
              onSubmit={searchStudent}
            >
              <div className={styles.inputGroup}>
                <label htmlFor="student-sis">
                  STUDENT SIS ID
                </label>

                <div className={styles.inputWrapper}>
                  <Icon name="search" size={19} />

                  <input
                    ref={inputRef}
                    id="student-sis"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6,12}"
                    placeholder="e.g. 104404156"
                    value={sisId}
                    onChange={e => setSisId(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                className={styles.primaryButton}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className={styles.spinner} />
                    Retrieving...
                  </>
                ) : (
                  <>
                    Search Student
                    <Icon name="arrow" size={18} />
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className={styles.errorMessage} role="alert">
                <Icon name="alert" size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className={styles.sourceNote}>
              <span className={styles.sourceDot} />
              Profile source: n8n Student Profile Emulator
            </div>
          </section>

          {/* LOADING ANIMATION */}
          {loading && (
            <div className={styles.loadingGrid}>
              <div className={styles.skeletonPanel}>
                <div className={styles.skeletonTitle} />
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonLineShort} />
                <div className={styles.skeletonLine} />
              </div>

              <div className={styles.skeletonPanel}>
                <div className={styles.skeletonTitle} />
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonLineShort} />
              </div>
            </div>
          )}

          {/* EMPTY STATE */}
          {!data && !loading && !error && (
            <section className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Icon name="file" size={34} />
              </div>

              <h3>No student selected</h3>
              <p>
                Enter a Student SIS ID above to view
                their academic profile, semester
                attendance, and available reports.
              </p>
            </section>
          )}

          {/* RESULTS */}
          {data && !loading && (
            <div
              ref={resultsRef}
              className={styles.results}
            >
              <div className={styles.resultsHeader}>
                <div>
                  <div className={styles.eyebrow}>
                    STUDENT RECORD
                  </div>
                  <h2>Student Overview</h2>
                </div>

                <span className={styles.syntheticBadge}>
                  <span className={styles.badgeDot} />
                  Synthetic Profile
                </span>
              </div>

              <div className={styles.profileGrid}>
                {/* PROFILE CARD */}
                <section className={styles.profileCard}>
                  <div className={styles.profileBanner}>
                    <div className={styles.profileAvatar}>
                      {data.profile.fullName
                        .split(' ')
                        .slice(0, 2)
                        .map(word => word.charAt(0))
                        .join('')
                        .toUpperCase()}
                    </div>
                  </div>

                  <div className={styles.profileBody}>
                    <h3>{data.profile.fullName}</h3>

                    <p className={styles.studentId}>
                      ID: {data.profile.sisId}
                    </p>

                    <div className={styles.profileBadges}>
                      <span className={styles.statusBadge}>
                        {data.profile.academicStatus}
                      </span>

                      <span className={styles.typeBadge}>
                        {data.profile.studentType}
                      </span>
                    </div>

                    <div className={styles.detailsGrid}>
                      <Detail
                        label="Programme"
                        value={data.profile.programme.name}
                      />
                      <Detail
                        label="Programme Code"
                        value={data.profile.programme.code}
                      />
                      <Detail
                        label="Faculty"
                        value={data.profile.faculty}
                      />
                      <Detail
                        label="Campus"
                        value={data.profile.campus}
                      />
                      <Detail
                        label="Year of Study"
                        value={data.profile.yearOfStudy}
                      />
                      <Detail
                        label="Current Semester"
                        value={data.profile.semester}
                      />
                      <Detail
                        label="Email Address"
                        value={data.profile.email}
                      />
                    </div>
                  </div>
                </section>

                {/* ENROLMENTS CARD */}
                <section className={styles.enrolmentCard}>
                  <div className={styles.cardHeading}>
                    <div>
                      <h3>Current Enrolments</h3>
                      <p>
                        Units provided by the student
                        profile emulator
                      </p>
                    </div>

                    <span className={styles.countPill}>
                      {enrolments.length} units
                    </span>
                  </div>

                  <div className={styles.unitList}>
                    {enrolments.length === 0 ? (
                      <p className={styles.muted}>
                        No enrolments returned.
                      </p>
                    ) : (
                      enrolments.map((unit, index) => (
                        <div
                          className={styles.unitItem}
                          key={unit.unitId}
                          style={{
                            animationDelay: `${index * 70}ms`,
                          }}
                        >
                          <div className={styles.unitIcon}>
                            <Icon name="book" size={19} />
                          </div>

                          <div className={styles.unitInfo}>
                            <strong>{unit.code}</strong>
                            <span>{unit.name}</span>
                          </div>

                          <span className={styles.unitStatus}>
                            {unit.enrolmentStatus}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>

              {/* ATTENDANCE */}
              <section className={styles.attendanceCard}>
                <div className={styles.cardHeading}>
                  <div>
                    <h3>Semester Attendance</h3>
                    <p>
                      Attendance results retrieved from
                      the separate n8n semester workflow.
                    </p>
                  </div>

                  <div className={styles.recordSummary}>
                    <span>
                      {availableRecords} available
                    </span>
                    <span>
                      {unavailableRecords} N/A
                    </span>
                  </div>
                </div>

                <div className={styles.tableScroll}>
                  <table className={styles.attendanceTable}>
                    <thead>
                      <tr>
                        <th>SEMESTER</th>
                        <th>INTAKE</th>
                        <th>ATTENDANCE</th>
                        <th>DATA SOURCE</th>
                      </tr>
                    </thead>

                    <tbody>
                      {semesters.length === 0 ? (
                        <tr>
                          <td colSpan={4}>
                            No semester records returned.
                          </td>
                        </tr>
                      ) : (
                        semesters.map(s => (
                          <tr key={s.semesterId}>
                            <td>
                              <strong>{s.label}</strong>
                            </td>

                            <td>{s.intake}</td>

                            <td>
                              <div className={styles.progressCell}>
                                <strong>
                                  {pct(s.percentage)}
                                </strong>

                                <div className={styles.progressTrack}>
                                  <div
                                    className={styles.progressFill}
                                    style={{
                                      width: `${
                                        s.percentage ?? 0
                                      }%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td>
                              <span
                                className={
                                  s.source === 'DEMO_SYNTHETIC'
                                    ? styles.demoSource
                                    : styles.verifiedSource
                                }
                              >
                                {s.source === 'DEMO_SYNTHETIC'
                                  ? 'Synthetic'
                                  : 'Qwickly-verified'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className={styles.attendanceFooter}>
                  <p>
                    {data.message ||
                      'Semester data is supplied by the attendance workflow.'}
                    {' '}N/A means no available percentage,
                    not zero attendance.
                  </p>
                </div>
              </section>

              {/* REPORT ACTION */}
              <section className={styles.reportBanner} ref={reportRef}>
                <div className={styles.reportBannerIcon}>
                  <Icon name="file" size={26} />
                </div>

                <div className={styles.reportBannerText}>
                  <h3>Prepare Attendance Report</h3>
                  <p>
                    Download formatted academic and compliance PDFs,
                    export semester records to CSV, or open the
                    print-ready report. All reports are demonstration drafts.
                  </p>
                </div>

                <div className={styles.reportActions}>
                  <button type="button" className={styles.reportButton} onClick={() => openDownload('academic')}>
                    <Icon name="file" size={17} /> Academic PDF
                  </button>
                  <button type="button" className={styles.reportSecondaryButton} onClick={() => openDownload('compliance')}>
                    Compliance PDF (Not Assessed)
                  </button>
                  <button type="button" className={styles.reportSecondaryButton} onClick={() => openDownload('csv')}>
                    Download CSV
                  </button>
                  <button type="button" className={styles.reportTextButton} onClick={openReport}>
                    Print-ready preview
                  </button>
                </div>
              </section>

              <div className={styles.disclaimer}>
                <Icon name="alert" size={17} />
                <span>
                  Prototype data notice: student profile
                  information is emulated. Attendance
                  records may also be synthetic. Generated
                  reports are drafts and are not official
                  university certifications.
                </span>
              </div>
            </div>
          )}

          <footer className={styles.footer}>
            <span>
              Smart Academic Attendance System
            </span>

            <span>
              Final Year Project • Administrator Portal
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}

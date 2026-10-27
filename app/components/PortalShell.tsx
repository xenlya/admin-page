 'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import styles from './portal.module.css';
const links = [
  {href:'/dashboard', icon:'▦', label:'Overview'},
  {href:'/students', icon:'⌕', label:'Student Search'},
  {href:'/attendance', icon:'▤', label:'Attendance'},
  {href:'/visa', icon:'◇', label:'Visa & Compliance'},
  {href:'/reports', icon:'⇩', label:'Reports & Excel'},
  {href:'/settings', icon:'⚙', label:'Settings'},
];
export default function PortalShell({email, children, title, subtitle}:{
  email:string; children:React.ReactNode; title:string; subtitle:string;
}) {
  const [opened, setOpened] = useState(false);
  const pathname = usePathname();
  return <div className={styles.app}>
    <aside className={`${styles.sidebar} ${opened ? styles.sidebarOpen : ''}`}>
      <Link href="/dashboard" className={styles.brand} onClick={()=>setOpened(false)}>
        <span className={styles.brandMark}>S</span><span><b>SWINBURNE</b><small>SARAWAK CAMPUS</small></span>
      </Link>
      <div className={styles.divider}/><div className={styles.sideCaption}>ADMIN WORKSPACE</div>
      <nav className={styles.navigation} aria-label="Main navigation">
        {links.map(link=><Link key={link.href} href={link.href} onClick={()=>setOpened(false)}
          className={`${styles.navLink} ${(pathname===link.href || (link.href==='/students' && pathname?.startsWith('/students/'))) ? styles.active : ''}`}>
          <span className={styles.navIcon}>{link.icon}</span>{link.label}
        </Link>)}
      </nav>
      <div className={styles.sidebarFoot}>
        <div className={styles.sideCard}><strong>Academic reporting</strong><p>Multi-student review workspace</p><span>● EMULATED DATA</span></div>
        <button className={styles.signout} onClick={()=>signOut({callbackUrl:'/login'})}>↪ &nbsp; Sign out</button>
      </div>
    </aside>
    {opened && <button type="button" aria-label="Close menu" className={styles.backdrop} onClick={()=>setOpened(false)}/>}
    <div className={styles.main}>
      <header className={styles.topbar}>
        <div className={styles.topbarStart}><button type="button" className={styles.mobileNav} onClick={()=>setOpened(!opened)}>☰</button>
          <span>Administration <span className={styles.slash}>/</span> <strong>{title}</strong></span></div>
        <div className={styles.topbarEnd}><span className={styles.demoPill}>● Prototype</span><div className={styles.account}>Administrator<small>{email}</small></div><div className={styles.avatar}>{email.slice(0,1).toUpperCase()}</div></div>
      </header>
      <main className={styles.content}>
        <div className={styles.pageHeader}><div className={styles.eyebrow}>SMART ACADEMIC ATTENDANCE</div><h1>{title}<span>.</span></h1><p>{subtitle}</p></div>
        <div className={styles.notice}><strong>Prototype / synthetic information:</strong> Admin data is emulated. Unit and weekly scores are illustrative; they are not verified Qwickly attendance or official visa decisions.</div>
        {children}
        <footer className={styles.footer}>Smart Academic Attendance System <span>Final Year Project · Administrator Portal</span></footer>
      </main>
    </div>
  </div>;
}

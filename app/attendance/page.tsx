import AuthorizedPage from '../components/AuthorizedPage';
import BatchWorkspace from '../components/BatchWorkspace';
export const dynamic = 'force-dynamic';
export default function Page({searchParams}:{searchParams?:{ids?:string}}){
  return <AuthorizedPage title="Attendance Records" subtitle="Compare attendance across students, then inspect each semester, unit and Class/Lab week.">
    <BatchWorkspace mode="attendance" initialIds={searchParams?.ids ?? ''}/>
  </AuthorizedPage>;
}

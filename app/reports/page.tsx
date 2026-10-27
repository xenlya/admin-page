import AuthorizedPage from '../components/AuthorizedPage';
import BatchWorkspace from '../components/BatchWorkspace';
export const dynamic = 'force-dynamic';
export default function Page({searchParams}:{searchParams?:{ids?:string}}){
  return <AuthorizedPage title="Reports & Excel" subtitle="Export multi-student Excel workbooks with simple headers for manual double checks.">
    <BatchWorkspace mode="reports" initialIds={searchParams?.ids ?? ''}/>
  </AuthorizedPage>;
}

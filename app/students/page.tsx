import AuthorizedPage from '../components/AuthorizedPage';
import BatchWorkspace from '../components/BatchWorkspace';
export const dynamic = 'force-dynamic';
export default function Page({searchParams}:{searchParams?:{ids?:string}}){
  return <AuthorizedPage title="Student Search" subtitle="Search multiple students simultaneously and drill down into semester, unit and weekly details.">
    <BatchWorkspace mode="students" initialIds={searchParams?.ids ?? ''}/>
  </AuthorizedPage>;
}

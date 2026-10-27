import AuthorizedPage from '../components/AuthorizedPage';
import BatchWorkspace from '../components/BatchWorkspace';
export const dynamic = 'force-dynamic';
export default function Page({searchParams}:{searchParams?:{ids?:string}}){
  return <AuthorizedPage title="Visa & Compliance" subtitle="Review emulated visa context with a clear non-official status notice.">
    <BatchWorkspace mode="visa" initialIds={searchParams?.ids ?? ''}/>
  </AuthorizedPage>;
}

import AuthorizedPage from '../../components/AuthorizedPage';
import StudentDetails from '../../components/StudentDetails';
export const dynamic = 'force-dynamic';
export default function StudentPage({params}:{params:{sisId:string}}) {
  return <AuthorizedPage title="Student Profile" subtitle="Click semester, then unit, then inspect individual Class and Lab attendance scores.">
    <StudentDetails sisId={params.sisId}/>
  </AuthorizedPage>;
}

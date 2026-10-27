import { redirect } from 'next/navigation';
import { requireAdmin } from '../../lib/require-admin';
import PortalShell from './PortalShell';
export const dynamic = 'force-dynamic';
export default async function AuthorizedPage({title,subtitle,children}:{title:string;subtitle:string;children:React.ReactNode}) {
  const session = await requireAdmin();
  if (!session) redirect('/login');
  return <PortalShell title={title} subtitle={subtitle} email={session.user?.email ?? ''}>{children}</PortalShell>;
}

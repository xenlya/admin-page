import { getServerSession } from 'next-auth';
import { authOptions, isAllowedAdmin } from './auth';
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user && isAllowedAdmin(session.user.email) ? session : null;
}

import type { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';

export function isAllowedAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowlist = (process.env.ADMIN_ALLOWED_EMAILS ?? '')
    .split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
  return allowlist.includes(email.trim().toLowerCase());
}

export const authOptions: NextAuthOptions = {
  providers: [AzureADProvider({
    clientId: process.env.AZURE_AD_CLIENT_ID ?? '',
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET ?? '',
    tenantId: process.env.AZURE_AD_TENANT_ID ?? '',
  })],
  session: { strategy: 'jwt', maxAge: 60 * 60 },
  callbacks: {
    async signIn({ user }) { return isAllowedAdmin(user.email); },
  },
  pages: { signIn: '/login', error: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
};

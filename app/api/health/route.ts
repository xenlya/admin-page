import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../lib/require-admin';
export const dynamic = 'force-dynamic';
export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({error:'Unauthorized'},{status:401,headers:{'Cache-Control':'no-store'}});
  return NextResponse.json({
    ok: Boolean(process.env.SEMESTER_WEBHOOK_URL && process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET),
    message:'Configured values present only; this does not verify n8n, Microsoft login, or official Qwickly data.'
  },{headers:{'Cache-Control':'no-store'}});
}

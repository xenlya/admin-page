import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/require-admin';
import { fetchBatch, parseIds } from '../../../../lib/batch';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error:'Unauthorized' }, { status:401 });
  try {
    const body: unknown = await request.json();
    const obj = body && typeof body === 'object' ? body as { ids?: unknown } : {};
    if (!Array.isArray(obj.ids) || !obj.ids.every(x => typeof x === 'string')) {
      return NextResponse.json({error: 'Provide ids as an array of SIS IDs'}, {status: 400});
    }
    const ids = parseIds(obj.ids);
    const results = await fetchBatch(ids);
    return NextResponse.json({ success: true, results, source: 'EMULATED_ADMIN_DATA' },
      { headers: {'Cache-Control': 'private, no-store'} });
  } catch (error) {
    return NextResponse.json({error: error instanceof Error ? error.message : 'Invalid request'},
      {status:400, headers: {'Cache-Control': 'no-store'}});
  }
}

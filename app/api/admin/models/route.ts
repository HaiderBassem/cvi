import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { listModels } from '@/lib/models/catalog';

export const dynamic = 'force-dynamic';

/** All models available to projects, with how many projects use each. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const usage = getDb()
    .prepare('SELECT model_id, COUNT(*) AS n FROM projects WHERE model_id IS NOT NULL GROUP BY model_id')
    .all() as unknown as { model_id: string; n: number }[];
  const used = new Map(usage.map((u) => [u.model_id, Number(u.n)]));

  return NextResponse.json({
    success: true,
    data: listModels().map((m) => ({ ...m, usedBy: used.get(m.id) ?? 0 })),
  });
}

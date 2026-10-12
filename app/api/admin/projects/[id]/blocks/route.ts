import { NextResponse } from 'next/server';
import { getBlocksByProjectId, saveBlocksForProject } from '@/lib/db';
import { getSession } from '@/lib/auth';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const blocks = getBlocksByProjectId(id, true);
  return NextResponse.json({ success: true, data: blocks });
}

export async function POST(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const { blocks } = body;
    if (!Array.isArray(blocks)) {
      return NextResponse.json({ error: 'Blocks array required' }, { status: 400 });
    }

    const saved = saveBlocksForProject(id, blocks);
    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save blocks' }, { status: 500 });
  }
}

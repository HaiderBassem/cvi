import { NextResponse } from 'next/server';
import { getNavigationItems, saveNavigationItems } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const items = getNavigationItems(false);
  return NextResponse.json({ success: true, data: items });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { items } = body;
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Items array required' }, { status: 400 });
    }

    const saved = saveNavigationItems(items);
    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save navigation' }, { status: 500 });
  }
}

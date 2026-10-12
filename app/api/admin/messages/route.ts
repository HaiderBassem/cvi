import { NextResponse } from 'next/server';
import { getContactMessages, getMessageCounts } from '@/lib/db';
import { fail, ok, requireAdmin } from '@/lib/http/api';

const FILTERS = ['inbox', 'new', 'read', 'archived'] as const;
type Filter = (typeof FILTERS)[number];

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const filter = (new URL(request.url).searchParams.get('filter') || 'inbox') as Filter;
  if (!FILTERS.includes(filter)) return fail('Unknown filter.');

  return ok({ items: getContactMessages(filter), counts: getMessageCounts() });
}

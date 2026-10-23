import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getNavigationItems, saveNavigationItems } from '@/lib/db';
import { NavigationSchema } from '@/lib/validation/schemas';
import { ok, parseJson, requireAdmin, serverError } from '@/lib/http/api';
import type { NavigationItemRecord } from '@/lib/db/types';

export async function GET() {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;
  return ok(getNavigationItems(false));
}

/** Replace the whole menu (order = array order). */
export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const parsed = await parseJson(request, NavigationSchema);
  if ('response' in parsed) return parsed.response;

  try {
    const saved = saveNavigationItems(
      parsed.data.items.map((i, n) => ({ ...i, id: i.id || `nav_${Date.now().toString(36)}${n}`, sort_order: n, hint: i.hint || null }) as NavigationItemRecord)
    );
    revalidatePath('/', 'layout');
    return ok(saved);
  } catch (err) {
    return serverError('navigation update', err);
  }
}

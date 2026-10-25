import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getPageLayout, updatePageLayout } from '@/lib/db';
import { PageLayoutSchema } from '@/lib/validation/schemas';
import { ok, parseJson, requireAdmin, serverError } from '@/lib/http/api';

export async function GET() {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;
  return ok(getPageLayout());
}

/** Save the order and visibility of the Home and About page sections. */
export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const parsed = await parseJson(request, PageLayoutSchema);
  if ('response' in parsed) return parsed.response;

  try {
    const saved = updatePageLayout(parsed.data);
    revalidatePath('/', 'layout');
    return ok(saved);
  } catch (err) {
    return serverError('page layout update', err);
  }
}

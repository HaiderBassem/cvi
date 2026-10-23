import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSiteContent, updateSiteContent } from '@/lib/db';
import { SiteContentSchema } from '@/lib/validation/schemas';
import { ok, parseJson, requireAdmin, serverError } from '@/lib/http/api';

export async function GET() {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;
  return ok(getSiteContent());
}

export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const parsed = await parseJson(request, SiteContentSchema);
  if ('response' in parsed) return parsed.response;

  try {
    const saved = updateSiteContent(parsed.data);
    revalidatePath('/', 'layout');
    return ok(saved);
  } catch (err) {
    return serverError('site content update', err);
  }
}

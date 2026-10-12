import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getDisciplines, saveDisciplines } from '@/lib/db';
import { DisciplinesSchema } from '@/lib/validation/schemas';
import { ok, parseJson, requireAdmin, serverError } from '@/lib/http/api';

export async function GET() {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;
  return ok(getDisciplines());
}

/** Replace the full list; array order becomes display order. */
export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const parsed = await parseJson(request, DisciplinesSchema);
  if ('response' in parsed) return parsed.response;

  try {
    const saved = saveDisciplines(parsed.data.items.map((d) => ({ ...d, tagline: d.tagline ?? null })));
    revalidatePath('/');
    revalidatePath('/about');
    return ok(saved);
  } catch (err) {
    return serverError('disciplines save', err);
  }
}

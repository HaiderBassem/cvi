import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getTeamPhoto, updateTeamPhoto } from '@/lib/db';
import { TeamPhotoSchema } from '@/lib/validation/schemas';
import { ok, parseJson, requireAdmin, serverError } from '@/lib/http/api';

/** The group photo the team is placed on (shown on the homepage and the About page). */
export async function GET() {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;
  return ok({ url: getTeamPhoto() });
}

export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const parsed = await parseJson(request, TeamPhotoSchema);
  if ('response' in parsed) return parsed.response;

  try {
    const url = updateTeamPhoto(parsed.data.url);
    revalidatePath('/');
    revalidatePath('/about');
    return ok({ url });
  } catch (err) {
    return serverError('team photo update', err);
  }
}

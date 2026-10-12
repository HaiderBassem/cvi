import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { deleteTeamMember, updateTeamMember } from '@/lib/db';
import { TeamMemberSchema } from '@/lib/validation/schemas';
import { fail, ok, parseJson, requireAdmin, serverError } from '@/lib/http/api';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  const parsed = await parseJson(request, TeamMemberSchema.partial());
  if ('response' in parsed) return parsed.response;

  try {
    const updated = updateTeamMember(id, parsed.data);
    if (!updated) return fail('That team member no longer exists.', 404);
    revalidatePath('/');
    revalidatePath('/about');
    return ok(updated);
  } catch (err) {
    return serverError('team update', err);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  try {
    if (!deleteTeamMember(id)) return fail('That team member no longer exists.', 404);
    revalidatePath('/');
    revalidatePath('/about');
    return ok({ id });
  } catch (err) {
    return serverError('team delete', err);
  }
}

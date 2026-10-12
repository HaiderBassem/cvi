import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createTeamMember, getTeamMembers, reorderTeamMembers } from '@/lib/db';
import { ReorderSchema, TeamMemberSchema } from '@/lib/validation/schemas';
import { ok, parseJson, requireAdmin, serverError } from '@/lib/http/api';

function refreshPublicPages() {
  revalidatePath('/');
  revalidatePath('/about');
}

export async function GET() {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;
  return ok(getTeamMembers());
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const parsed = await parseJson(request, TeamMemberSchema);
  if ('response' in parsed) return parsed.response;

  try {
    const created = createTeamMember(parsed.data);
    refreshPublicPages();
    return ok(created, 201);
  } catch (err) {
    return serverError('team create', err);
  }
}

/** Reorder: body `{ ids: string[] }` in the new order. */
export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const parsed = await parseJson(request, ReorderSchema);
  if ('response' in parsed) return parsed.response;

  try {
    reorderTeamMembers(parsed.data.ids);
    refreshPublicPages();
    return ok(getTeamMembers());
  } catch (err) {
    return serverError('team reorder', err);
  }
}

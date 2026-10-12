import { NextResponse } from 'next/server';
import { deleteContactMessage, getMessageCounts, setMessageStatus } from '@/lib/db';
import { MessageStatusSchema } from '@/lib/validation/schemas';
import { fail, ok, parseJson, requireAdmin, serverError } from '@/lib/http/api';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  const parsed = await parseJson(request, MessageStatusSchema);
  if ('response' in parsed) return parsed.response;

  try {
    const updated = setMessageStatus(id, parsed.data.status);
    if (!updated) return fail('That message no longer exists.', 404);
    return ok({ item: updated, counts: getMessageCounts() });
  } catch (err) {
    return serverError('message status', err);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  try {
    if (!deleteContactMessage(id)) return fail('That message no longer exists.', 404);
    return ok({ counts: getMessageCounts() });
  } catch (err) {
    return serverError('message delete', err);
  }
}

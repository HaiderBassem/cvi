import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { getModel, removeUpload } from '@/lib/models/catalog';

/** Deletes an uploaded model. Built-in models and models still used by a project are kept. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const model = getModel(id);
  if (!model) return NextResponse.json({ error: 'Model not found.' }, { status: 404 });
  if (model.source !== 'upload') {
    return NextResponse.json({ error: 'Built-in models cannot be deleted.' }, { status: 403 });
  }

  const users = getDb().prepare('SELECT title FROM projects WHERE model_id = ?').all(id) as unknown as { title: string }[];
  if (users.length > 0) {
    return NextResponse.json(
      { error: `Still used by: ${users.map((u) => u.title).join(', ')}. Choose another model for those projects first.` },
      { status: 409 }
    );
  }

  removeUpload(id);
  return NextResponse.json({ success: true });
}

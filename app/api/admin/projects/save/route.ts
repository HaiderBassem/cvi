import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { saveProjectBundle, SlugTakenError } from '@/lib/db';
import { getModel } from '@/lib/models/catalog';
import { ProjectSaveSchema } from '@/lib/validation/project';

/**
 * Save a project and all of its story sections in one request (create when `project.id` is
 * absent). Validated on the server; field problems come back keyed by path so the editor can
 * put each message next to its field.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'The request could not be read.' }, { status: 400 });
  }

  const parsed = ProjectSaveSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.');
      if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
    }
    return NextResponse.json({ error: 'Some fields need attention.', fieldErrors }, { status: 422 });
  }

  const { project, blocks } = parsed.data;
  if (project.model_id && !getModel(project.model_id)) {
    return NextResponse.json(
      { error: 'Some fields need attention.', fieldErrors: { 'project.model_id': 'That 3D model no longer exists. Choose another or remove it.' } },
      { status: 422 }
    );
  }

  try {
    const saved = saveProjectBundle({ project, blocks });
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    if (error instanceof SlugTakenError) {
      return NextResponse.json({ error: error.message, fieldErrors: { 'project.slug': error.message } }, { status: 409 });
    }
    console.error('[api] project save:', error);
    return NextResponse.json({ error: 'Saving failed. Your edits are still on screen; please try again.' }, { status: 500 });
  }
}

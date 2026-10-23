import fs from 'node:fs';
import { Readable } from 'node:stream';
import { getModel, uploadFilePath } from '@/lib/models/catalog';

/** Serves an uploaded model. The id is validated and looked up in the catalog; it is never used as a raw path. */
export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const model = getModel(id);
  if (!model || model.source !== 'upload') return new Response('Not found', { status: 404 });

  let size: number;
  try {
    size = fs.statSync(uploadFilePath(id)).size;
  } catch {
    return new Response('Not found', { status: 404 });
  }

  // Ids are unique per upload, so the file never changes: let browsers keep it.
  return new Response(Readable.toWeb(fs.createReadStream(uploadFilePath(id))) as ReadableStream, {
    headers: {
      'Content-Type': 'model/gltf-binary',
      'Content-Length': String(size),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

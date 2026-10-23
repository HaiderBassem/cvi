import { NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getSession } from '@/lib/auth';
import { registerUpload, UPLOAD_DIRECTORY, uploadFilePath, type ModelInfo } from '@/lib/models/catalog';

/**
 * Upload a 3D model for a project. The only accepted format is FBX (what the studio's
 * design software exports); it is converted on the server into the lightweight web format
 * the site streams, so a 100 MB export becomes a file of a few MB.
 *
 * This route lives outside /api/admin on purpose: the admin middleware buffers request
 * bodies and caps them at 10 MB, which would cut a large FBX short. The session is checked
 * here instead.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const MAX_BYTES = 250 * 1024 * 1024;
const CONVERT_TIMEOUT_MS = 4 * 60 * 1000;

/** One conversion at a time: a big FBX needs a few GB of memory. */
let queue: Promise<unknown> = Promise.resolve();
function exclusive<T>(job: () => Promise<T>): Promise<T> {
  const run = queue.then(job, job);
  queue = run.catch(() => undefined);
  return run;
}

function looksLikeFbx(head: Buffer) {
  const text = head.toString('latin1');
  return text.startsWith('Kaydara FBX Binary') || text.startsWith('; FBX');
}

function slugFrom(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'model'
  );
}

function convert(input: string, id: string, label: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const script = path.join(process.cwd(), 'scripts', 'models', 'convert-fbx.mjs');
    // A long-running server can outlive the Node install it started from (e.g. after an upgrade),
    // so fall back to whatever `node` is on the PATH now.
    const nodeBin = fs.existsSync(process.execPath) ? process.execPath : 'node';
    const child = spawn(
      nodeBin,
      ['--max-old-space-size=8192', script, '--file', input, '--id', id, '--out', UPLOAD_DIRECTORY, '--label', label],
      { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] }
    );
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out = (out + d).slice(-20000)));
    child.stderr.on('data', (d) => (err = (err + d).slice(-4000)));
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('The conversion took too long. Try a simpler export of the model.'));
    }, CONVERT_TIMEOUT_MS);
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      const line = out.split('\n').reverse().find((l) => l.startsWith('RESULT '));
      if (code === 0 && line) {
        try {
          resolve(JSON.parse(line.slice(7)));
          return;
        } catch {
          /* fall through */
        }
      }
      console.error('[models] conversion failed:', err.slice(-800));
      reject(new Error('This FBX could not be converted. Check that it exports geometry (not only cameras or lights).'));
    });
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let tmp: string | null = null;
  let createdId: string | null = null;
  let registered = false;
  try {
    const form = await request.formData();
    const file = form.get('file');
    const labelInput = String(form.get('label') ?? '').trim();

    if (!(file instanceof File)) return NextResponse.json({ error: 'No file was sent.' }, { status: 400 });
    if (!file.name.toLowerCase().endsWith('.fbx')) {
      return NextResponse.json({ error: 'Only .fbx files are accepted for 3D models.' }, { status: 415 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'That file is larger than 250 MB. Export a lighter version of the model.' }, { status: 413 });
    }
    if (file.size < 64) return NextResponse.json({ error: 'That file is empty.' }, { status: 400 });

    const bytes = Buffer.from(await file.arrayBuffer());
    if (!looksLikeFbx(bytes.subarray(0, 32))) {
      return NextResponse.json({ error: 'That file is not a valid FBX model.' }, { status: 415 });
    }

    const id = `u-${slugFrom(file.name)}-${crypto.randomBytes(3).toString('hex')}`;
    createdId = id;
    const label = (labelInput || file.name.replace(/\.[^.]+$/, '')).slice(0, 100);
    tmp = path.join(os.tmpdir(), `${id}.fbx`);
    fs.writeFileSync(tmp, bytes);

    const info = await exclusive(() => convert(tmp as string, id, label));
    const model: ModelInfo = registerUpload({
      id,
      label,
      bytes: Number(info.bytes),
      triangles: Number(info.triangles),
    });
    registered = true;
    return NextResponse.json({ success: true, data: model }, { status: 201 });
  } catch (error) {
    console.error('[api] model upload:', error);
    return NextResponse.json({ error: (error as Error).message || 'Upload failed. Please try again.' }, { status: 500 });
  } finally {
    if (tmp) fs.rm(tmp, { force: true }, () => undefined);
    // A failed or aborted conversion must not leave an unlisted file behind.
    if (createdId && !registered) fs.rm(uploadFilePath(createdId), { force: true }, () => undefined);
  }
}

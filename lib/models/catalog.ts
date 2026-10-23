import fs from 'fs';
import path from 'path';
import generated from './generated.json';

/**
 * The 3D models available to projects.
 *
 * - Built-in: converted from the studio's original FBX exports (`npm run models:build`),
 *   shipped in public/models/projects and listed in lib/models/generated.json.
 * - Uploaded: FBX files uploaded in the admin are converted on the server to the same web
 *   format and stored in data/models (with an index.json), served through /api/models/<id>.
 *
 * A project links to one by `projects.model_id`; the file is only fetched when that project
 * page is opened. Server-only: it reads the file system.
 */
export interface ModelInfo {
  id: string;
  label: string;
  /** Compressed GLB size in bytes (drives the loading progress bar). */
  bytes: number;
  triangles: number;
  /** Where the browser fetches it. */
  url: string;
  source: 'builtin' | 'upload';
  /** ISO date, uploads only. */
  createdAt?: string;
}

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'models');
const UPLOAD_INDEX = path.join(UPLOAD_DIR, 'index.json');

type UploadRecord = Omit<ModelInfo, 'url' | 'source'>;

const BUILTIN: Record<string, ModelInfo> = Object.fromEntries(
  Object.values(generated as unknown as Record<string, { id: string; label: string; bytes: number; triangles: number }>).map((m) => [
    m.id,
    { id: m.id, label: m.label, bytes: m.bytes, triangles: m.triangles, url: `/models/projects/${m.id}.glb`, source: 'builtin' as const },
  ])
);

/** Model ids are file names: letters, digits and dashes only (never a path). */
export const MODEL_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,80}$/;

function readUploads(): Record<string, UploadRecord> {
  try {
    return JSON.parse(fs.readFileSync(UPLOAD_INDEX, 'utf8')) as Record<string, UploadRecord>;
  } catch {
    return {};
  }
}

function writeUploads(records: Record<string, UploadRecord>) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const tmp = `${UPLOAD_INDEX}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(records, null, 2) + '\n');
  fs.renameSync(tmp, UPLOAD_INDEX);
}

/** Where an uploaded model's GLB lives. Throws on an id that is not a plain file name. */
export function uploadFilePath(id: string): string {
  if (!MODEL_ID_PATTERN.test(id)) throw new Error('Invalid model id');
  return path.join(UPLOAD_DIR, `${id}.glb`);
}

export const UPLOAD_DIRECTORY = UPLOAD_DIR;

function allModels(): Record<string, ModelInfo> {
  const uploads = readUploads();
  const out: Record<string, ModelInfo> = { ...BUILTIN };
  for (const [id, m] of Object.entries(uploads)) {
    if (!MODEL_ID_PATTERN.test(id) || !fs.existsSync(uploadFilePath(id))) continue;
    out[id] = { ...m, id, url: `/api/models/${id}`, source: 'upload' };
  }
  return out;
}

/** All models, alphabetically by label (for the admin picker). */
export function listModels(): ModelInfo[] {
  return Object.values(allModels()).sort((a, b) => a.label.localeCompare(b.label));
}

export function getModel(id: string | null | undefined): ModelInfo | null {
  if (!id || !MODEL_ID_PATTERN.test(id)) return null;
  const all = allModels();
  return Object.prototype.hasOwnProperty.call(all, id) ? all[id] : null;
}

export function modelUrl(id: string): string {
  return getModel(id)?.url ?? `/models/projects/${id}.glb`;
}

export function registerUpload(record: UploadRecord): ModelInfo {
  const uploads = readUploads();
  uploads[record.id] = { ...record, createdAt: record.createdAt ?? new Date().toISOString() };
  writeUploads(uploads);
  return getModel(record.id)!;
}

/** Removes an uploaded model. Built-in models cannot be deleted. */
export function removeUpload(id: string): boolean {
  const uploads = readUploads();
  if (!uploads[id]) return false;
  delete uploads[id];
  writeUploads(uploads);
  try {
    fs.unlinkSync(uploadFilePath(id));
  } catch {
    /* already gone */
  }
  return true;
}

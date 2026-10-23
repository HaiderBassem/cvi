import { getDb } from '@/lib/db';
import { listModels, type ModelInfo } from './catalog';

/** Server helpers for the admin: models with how many projects use each, and the typologies in use. */

export function listModelsWithUsage(): (ModelInfo & { usedBy: number })[] {
  const rows = getDb()
    .prepare('SELECT model_id, COUNT(*) AS n FROM projects WHERE model_id IS NOT NULL GROUP BY model_id')
    .all() as unknown as { model_id: string; n: number }[];
  const used = new Map(rows.map((r) => [r.model_id, Number(r.n)]));
  return listModels().map((m) => ({ ...m, usedBy: used.get(m.id) ?? 0 }));
}

/** Distinct project types already used, case-insensitively, for the editor's suggestions. */
export function listTypologies(): string[] {
  const rows = getDb().prepare("SELECT typology FROM projects WHERE typology IS NOT NULL AND TRIM(typology) != ''").all() as unknown as {
    typology: string;
  }[];
  const seen = new Map<string, string>();
  for (const { typology } of rows) {
    const t = typology.trim();
    const k = t.toLowerCase();
    if (!seen.has(k)) seen.set(k, t.charAt(0).toUpperCase() + t.slice(1));
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

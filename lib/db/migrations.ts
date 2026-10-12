import type { DatabaseSync } from 'node:sqlite';

/**
 * Versioned, forward-only schema migrations for the SQLite store.
 *
 * `schema.sql` creates the original tables (idempotent). Anything added after
 * that lives here so existing databases are upgraded in place. Every migration
 * is additive (new tables, nullable or defaulted columns) and records its DOWN
 * steps so a rollback is a documented, deliberate act rather than a guess.
 * Never edit a migration once it has run — add a new one.
 */
interface Migration {
  version: number;
  name: string;
  up: string[];
  down: string[];
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'create_contact_messages',
    up: [
      `CREATE TABLE IF NOT EXISTS contact_messages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        typology TEXT,
        scale TEXT,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'new',
        created_at TEXT NOT NULL,
        read_at TEXT
      )`,
      `CREATE INDEX IF NOT EXISTS idx_messages_status_created ON contact_messages(status, created_at)`,
    ],
    down: [`DROP INDEX IF EXISTS idx_messages_status_created`, `DROP TABLE IF EXISTS contact_messages`],
  },
  {
    version: 2,
    name: 'add_project_site_coordinates',
    up: [`ALTER TABLE projects ADD COLUMN site_lat REAL`, `ALTER TABLE projects ADD COLUMN site_lng REAL`],
    down: [`ALTER TABLE projects DROP COLUMN site_lng`, `ALTER TABLE projects DROP COLUMN site_lat`],
  },
  {
    version: 3,
    name: 'add_team_member_visibility',
    up: [`ALTER TABLE team_members ADD COLUMN is_visible INTEGER NOT NULL DEFAULT 1`],
    down: [`ALTER TABLE team_members DROP COLUMN is_visible`],
  },
];

function ensureLedger(db: DatabaseSync) {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL
  )`);
}

function appliedVersions(db: DatabaseSync): Set<number> {
  const rows = db.prepare('SELECT version FROM schema_migrations').all() as unknown as { version: number }[];
  return new Set(rows.map((r) => Number(r.version)));
}

/** Apply every pending migration, each in its own transaction. */
export function runMigrations(db: DatabaseSync): number[] {
  ensureLedger(db);
  const done = appliedVersions(db);
  const applied: number[] = [];

  for (const m of MIGRATIONS) {
    if (done.has(m.version)) continue;
    db.exec('BEGIN');
    try {
      for (const sql of m.up) db.exec(sql);
      db.prepare('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)').run(
        m.version,
        m.name,
        new Date().toISOString()
      );
      db.exec('COMMIT');
      applied.push(m.version);
    } catch (err) {
      db.exec('ROLLBACK');
      throw new Error(`Migration ${m.version} (${m.name}) failed: ${(err as Error).message}`);
    }
  }
  return applied;
}

/** Roll back to (but not including) `targetVersion`. Manual use only. */
export function rollbackTo(db: DatabaseSync, targetVersion: number): number[] {
  ensureLedger(db);
  const done = appliedVersions(db);
  const reverted: number[] = [];

  for (const m of [...MIGRATIONS].reverse()) {
    if (m.version <= targetVersion || !done.has(m.version)) continue;
    db.exec('BEGIN');
    try {
      for (const sql of m.down) db.exec(sql);
      db.prepare('DELETE FROM schema_migrations WHERE version = ?').run(m.version);
      db.exec('COMMIT');
      reverted.push(m.version);
    } catch (err) {
      db.exec('ROLLBACK');
      throw new Error(`Rollback of ${m.version} (${m.name}) failed: ${(err as Error).message}`);
    }
  }
  return reverted;
}

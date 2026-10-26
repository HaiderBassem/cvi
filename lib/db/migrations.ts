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
  {
    version: 4,
    name: 'add_project_model_id',
    // `model_id` names a converted 3D model (lib/models/catalog.ts). The seeded links are only the
    // ones whose FBX clearly belongs to the project; everything else is chosen in the admin.
    up: [
      `ALTER TABLE projects ADD COLUMN model_id TEXT`,
      ...(
        [
          ['budoor-zoo', 'budoor-zoo'],
          ['606-restaurants', 'restaurant-606'],
          ['albina-almarkazy-workshop', 'bmc-workshops'],
          ['diyar-management', 'aldyar-management'],
          ['babylon-industrial-city', 'medical-industrial-city'],
          ['al-zareef', 'al-zareef'],
          ['se7en-castle-school-complex', 'se7en-castle-school'],
          ['al-ghadeer-kindergarten', 'al-ghadeer-kindergarten'],
          ['imam-hassan-mosque', 'imam-hassan-mosque'],
          ['al-jid-mosque', 'al-jid-mosque'],
          ['ghadeer-karbala-mosque', 'ghadeer-karbala-mosque'],
        ] as const
      ).map(([slug, model]) => `UPDATE projects SET model_id = '${model}' WHERE slug = '${slug}' AND model_id IS NULL`),
    ],
    down: [`ALTER TABLE projects DROP COLUMN model_id`],
  },
  {
    version: 5,
    name: 'add_navigation_hint_and_plain_labels',
    // `hint` is the one-line description under each link in the phone menu. The seeded labels
    // are only replaced where they are still the original ones, so edits made in the admin win.
    up: [
      `ALTER TABLE navigation_items ADD COLUMN hint TEXT`,
      `UPDATE navigation_items SET label = 'Home', hint = 'Back to the start' WHERE id = 'nav_home' AND label = 'Index'`,
      `UPDATE navigation_items SET hint = 'Our architecture and design work' WHERE id = 'nav_projects' AND hint IS NULL`,
      `UPDATE navigation_items SET label = 'About us', hint = 'Who we are and how we work' WHERE id = 'nav_about' AND label = 'About'`,
      `UPDATE navigation_items SET hint = 'Start a project with us' WHERE id = 'nav_contact' AND hint IS NULL`,
      // The admin login is not a public menu item; it has its own small link.
      `UPDATE navigation_items SET is_visible = 0 WHERE id = 'nav_admin'`,
    ],
    down: [`ALTER TABLE navigation_items DROP COLUMN hint`],
  },
  {
    version: 6,
    name: 'add_project_background_settings',
    // What fills the page behind a project: 'auto' = the 3D model if there is one, else the picture;
    // 'picture' = the picture only; 'color' = a plain colour. `bg_dim` darkens the picture (0-90 %).
    up: [
      `ALTER TABLE projects ADD COLUMN bg_mode TEXT NOT NULL DEFAULT 'auto'`,
      `ALTER TABLE projects ADD COLUMN bg_image_url TEXT`,
      `ALTER TABLE projects ADD COLUMN bg_dim INTEGER NOT NULL DEFAULT 50`,
    ],
    down: [
      `ALTER TABLE projects DROP COLUMN bg_dim`,
      `ALTER TABLE projects DROP COLUMN bg_image_url`,
      `ALTER TABLE projects DROP COLUMN bg_mode`,
    ],
  },
  {
    version: 7,
    name: 'add_team_member_photo_region',
    // Where each person stands on the group photo (a rectangle, in % of the photo). Null = not placed.
    up: [
      `ALTER TABLE team_members ADD COLUMN photo_x REAL`,
      `ALTER TABLE team_members ADD COLUMN photo_y REAL`,
      `ALTER TABLE team_members ADD COLUMN photo_w REAL`,
      `ALTER TABLE team_members ADD COLUMN photo_h REAL`,
    ],
    down: [
      `ALTER TABLE team_members DROP COLUMN photo_h`,
      `ALTER TABLE team_members DROP COLUMN photo_w`,
      `ALTER TABLE team_members DROP COLUMN photo_y`,
      `ALTER TABLE team_members DROP COLUMN photo_x`,
    ],
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

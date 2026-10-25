import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { describe, it, expect, afterAll } from 'vitest';
import { MIGRATIONS, runMigrations, rollbackTo } from '@/lib/db/migrations';
import {
  createContactMessage,
  deleteContactMessage,
  getContactMessages,
  getMessageCounts,
  setMessageStatus,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  getTeamMembers,
  getSiteContent,
  DEFAULT_SITE_CONTENT,
} from '@/lib/db';

function freshDb() {
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(path.join(process.cwd(), 'lib', 'db', 'schema.sql'), 'utf8'));
  return db;
}

const columns = (db: DatabaseSync, table: string) =>
  (db.prepare(`PRAGMA table_info(${table})`).all() as unknown as { name: string }[]).map((c) => c.name);

describe('schema migrations', () => {
  it('applies every migration once and is idempotent', () => {
    const db = freshDb();
    expect(runMigrations(db)).toEqual(MIGRATIONS.map((m) => m.version));
    expect(runMigrations(db)).toEqual([]);
    expect(columns(db, 'projects')).toEqual(expect.arrayContaining(['site_lat', 'site_lng']));
    expect(columns(db, 'team_members')).toContain('is_visible');
    expect(columns(db, 'contact_messages')).toEqual(expect.arrayContaining(['status', 'read_at']));
  });

  it('rolls back to a target version and can re-apply', () => {
    const db = freshDb();
    runMigrations(db);
    const later = MIGRATIONS.map((m) => m.version).filter((v) => v > 1);
    expect(rollbackTo(db, 1)).toEqual([...later].reverse());
    expect(columns(db, 'projects')).not.toContain('site_lat');
    expect(columns(db, 'projects')).not.toContain('model_id');
    expect(columns(db, 'team_members')).not.toContain('is_visible');
    expect(columns(db, 'contact_messages').length).toBeGreaterThan(0);
    expect(columns(db, 'projects')).not.toContain('bg_mode');
    expect(runMigrations(db)).toEqual(later);
    expect(columns(db, 'projects')).toEqual(expect.arrayContaining(['bg_mode', 'bg_image_url', 'bg_dim']));
  });

  it('links a project to its 3D model, only where the slug matches', () => {
    const db = freshDb();
    // runMigrations is what seeds the links, so the rows must exist before it runs
    db.exec(`INSERT INTO projects (id, slug, title, created_at, updated_at) VALUES
      ('a', 'budoor-zoo', 'Budoor Zoo', 'x', 'x'), ('b', 'some-other-project', 'Other', 'x', 'x')`);
    runMigrations(db);
    const rows = db.prepare('SELECT slug, model_id FROM projects ORDER BY slug').all() as unknown as { slug: string; model_id: string | null }[];
    expect(rows).toEqual([
      { slug: 'budoor-zoo', model_id: 'budoor-zoo' },
      { slug: 'some-other-project', model_id: null },
    ]);
  });
});

describe('contact messages repository', () => {
  const created: string[] = [];
  afterAll(() => created.forEach((id) => deleteContactMessage(id)));

  it('stores a brief as new, then tracks read / archive / unread', () => {
    const before = getMessageCounts();
    const m = createContactMessage({ name: 'Vitest', email: 'vitest@example.com', typology: null, scale: null, message: 'Repository round-trip.' });
    created.push(m.id);
    expect(m.status).toBe('new');
    expect(getMessageCounts().unread).toBe(before.unread + 1);

    const read = setMessageStatus(m.id, 'read')!;
    expect(read.status).toBe('read');
    expect(read.read_at).not.toBeNull();

    setMessageStatus(m.id, 'archived');
    expect(getContactMessages('inbox').some((x) => x.id === m.id)).toBe(false);
    expect(getContactMessages('archived').some((x) => x.id === m.id)).toBe(true);

    const unread = setMessageStatus(m.id, 'new')!;
    expect(unread.read_at).toBeNull();
  });

  it('deleting a missing message reports false', () => {
    expect(deleteContactMessage('msg_does_not_exist')).toBe(false);
  });
});

describe('team repository', () => {
  const created: string[] = [];
  afterAll(() => created.forEach((id) => deleteTeamMember(id)));

  it('creates at the end, hides from the public list, updates and deletes', () => {
    const count = getTeamMembers().length;
    const t = createTeamMember({
      name: 'Vitest Person',
      role: 'Test',
      department: '',
      bio: '',
      avatar_url: '/brand/map.png',
      is_leadership: 0,
      is_visible: 1,
    });
    created.push(t.id);
    const all = getTeamMembers();
    expect(all.length).toBe(count + 1);
    expect(all[all.length - 1].id).toBe(t.id);

    updateTeamMember(t.id, { is_visible: 0, role: 'Hidden tester' });
    expect(getTeamMembers(true).some((x) => x.id === t.id)).toBe(false);
    expect(getTeamMembers().find((x) => x.id === t.id)?.role).toBe('Hidden tester');
  });
});

describe('site content', () => {
  it('always returns every field (defaults fill gaps)', () => {
    const c = getSiteContent();
    for (const key of Object.keys(DEFAULT_SITE_CONTENT)) expect(c).toHaveProperty(key);
    expect(c.pillars.length).toBeGreaterThan(0);
  });
});

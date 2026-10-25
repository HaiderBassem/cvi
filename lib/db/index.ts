import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import type {
  ProjectRecord,
  ProjectBlockRecord,
  MediaAssetRecord,
  GlobalSettings,
  NavigationItemRecord,
  TeamMemberRecord,
  DisciplineRecord,
  AdminUserRecord,
  ContactMessageRecord,
  MessageStatus,
  SiteContent,
} from './types';
import { runMigrations } from './migrations';
import { getModel } from '../models/catalog';
import { COPY_DEFAULTS, DEFAULT_HERO_STATS } from '../content/copy';
import { DEFAULT_PAGE_LAYOUT, normalizeLayout, type PageLayout } from '../content/layout';

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'cvi.db');
  dbInstance = new DatabaseSync(dbPath);
  // Several processes (Next workers, scripts, tests) share this file: wait for a
  // lock instead of failing at once, and let readers proceed during a write.
  dbInstance.exec('PRAGMA busy_timeout = 5000');
  dbInstance.exec('PRAGMA journal_mode = WAL');

  // Initialize schema
  const schemaPath = path.join(process.cwd(), 'lib', 'db', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    dbInstance.exec(schemaSql);
  }
  runMigrations(dbInstance);

  return dbInstance;
}

// Convert node:sqlite null-prototype objects to plain JS objects for Next.js RSC serialization
function toPlain<T>(data: T): T {
  if (data === null || data === undefined) return data;
  return JSON.parse(JSON.stringify(data)) as T;
}

// ----------------- PROJECTS -----------------

export function getAllProjects(options?: {
  includeDrafts?: boolean;
  featuredOnly?: boolean;
  typology?: string;
}): ProjectRecord[] {
  const db = getDb();
  let query = 'SELECT * FROM projects WHERE 1=1';
  const params: (string | number | bigint | null | Uint8Array)[] = [];

  if (!options?.includeDrafts) {
    query += " AND status_state = 'published'";
  }

  if (options?.featuredOnly) {
    query += ' AND is_featured = 1';
  }

  if (options?.typology && options.typology !== 'all') {
    query += ' AND LOWER(typology) LIKE ?';
    params.push(`%${options.typology.toLowerCase()}%`);
  }

  query += ' ORDER BY sort_order ASC, created_at DESC';

  const stmt = db.prepare(query);
  return toPlain(stmt.all(...params) as unknown as ProjectRecord[]);
}

export function getProjectBySlug(slug: string): ProjectRecord | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM projects WHERE slug = ?');
  const res = stmt.get(slug);
  return toPlain((res as unknown as ProjectRecord) || null);
}

export function getProjectById(id: string): ProjectRecord | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
  const res = stmt.get(id);
  return toPlain((res as unknown as ProjectRecord) || null);
}

/** The picture's darkening is a whole percentage between 0 and 90; anything else falls back to the default 50. */
function clampDim(v: unknown): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : 50;
  return Math.min(90, Math.max(0, n));
}

export function createProject(p: Partial<ProjectRecord> & { title: string; slug: string }): ProjectRecord {
  const db = getDb();
  const now = new Date().toISOString();
  const id = p.id || 'cvi_' + Math.random().toString(36).substring(2, 11);

  const stmt = db.prepare(`
    INSERT INTO projects (
      id, slug, title, subtitle, client, year, location, typology, size, status,
      hero_image_url, thumbnail_url, summary, description, theme_bg_color, theme_accent_color,
      is_featured, status_state, sort_order, custom_metadata_json, model_id, bg_mode, bg_image_url, bg_dim, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  stmt.run(
    id,
    p.slug,
    p.title,
    p.subtitle || null,
    p.client || null,
    p.year || null,
    p.location || null,
    p.typology || null,
    p.size || null,
    p.status || null,
    p.hero_image_url || null,
    p.thumbnail_url || null,
    p.summary || null,
    p.description || null,
    p.theme_bg_color || '#0a0a0c',
    p.theme_accent_color || '#4cb8f5',
    p.is_featured ? 1 : 0,
    p.status_state || 'published',
    p.sort_order ?? 0,
    p.custom_metadata_json || '{}',
    getModel(p.model_id) ? p.model_id! : null,
    p.bg_mode || 'auto',
    p.bg_image_url || null,
    clampDim(p.bg_dim),
    p.created_at || now,
    p.updated_at || now
  );

  return getProjectById(id)!;
}

export function updateProject(id: string, updates: Partial<ProjectRecord>): ProjectRecord | null {
  const db = getDb();
  const existing = getProjectById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updated: ProjectRecord = {
    ...existing,
    ...updates,
    id, // cannot change id
    updated_at: now,
  };

  const stmt = db.prepare(`
    UPDATE projects SET
      slug = ?,
      title = ?,
      subtitle = ?,
      client = ?,
      year = ?,
      location = ?,
      typology = ?,
      size = ?,
      status = ?,
      hero_image_url = ?,
      thumbnail_url = ?,
      summary = ?,
      description = ?,
      theme_bg_color = ?,
      theme_accent_color = ?,
      is_featured = ?,
      status_state = ?,
      sort_order = ?,
      custom_metadata_json = ?,
      site_lat = ?,
      site_lng = ?,
      model_id = ?,
      bg_mode = ?,
      bg_image_url = ?,
      bg_dim = ?,
      updated_at = ?
    WHERE id = ?
  `);

  stmt.run(
    updated.slug,
    updated.title,
    updated.subtitle,
    updated.client,
    updated.year,
    updated.location,
    updated.typology,
    updated.size,
    updated.status,
    updated.hero_image_url,
    updated.thumbnail_url,
    updated.summary,
    updated.description,
    updated.theme_bg_color,
    updated.theme_accent_color,
    updated.is_featured,
    updated.status_state,
    updated.sort_order,
    updated.custom_metadata_json,
    updated.site_lat ?? null,
    updated.site_lng ?? null,
    // Only ever store an id the catalog knows, so a stale or hand-edited value cannot 404 the viewer.
    getModel(updated.model_id) ? updated.model_id : null,
    updated.bg_mode || 'auto',
    updated.bg_image_url || null,
    clampDim(updated.bg_dim),
    updated.updated_at,
    id
  );

  return getProjectById(id);
}

export function deleteProject(id: string): boolean {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
  stmt.run(id);
  return true;
}

export function reorderProjects(ids: string[]): boolean {
  const db = getDb();
  const stmt = db.prepare('UPDATE projects SET sort_order = ? WHERE id = ?');
  ids.forEach((id, index) => {
    stmt.run(index, id);
  });
  return true;
}

/** A project can be saved only if its web address is free. */
export class SlugTakenError extends Error {
  constructor(public slug: string) {
    super(`The address "${slug}" is already used by another project.`);
  }
}

/**
 * Create or update a project together with its story sections in ONE transaction, so a failure
 * part-way can never leave a project half-written. `input.project.id` present = update.
 */
export function saveProjectBundle(input: {
  project: {
    id?: string;
    slug: string;
    title: string;
    subtitle: string;
    client: string;
    year: string;
    location: string;
    typology: string;
    size: string;
    status: string;
    summary: string;
    description: string;
    hero_image_url: string;
    thumbnail_url: string;
    theme_bg_color: string;
    is_featured: number;
    status_state: ProjectRecord['status_state'];
    model_id: string | null;
    bg_mode: ProjectRecord['bg_mode'];
    bg_image_url: string;
    bg_dim: number;
    custom_metadata: Record<string, string>;
  };
  blocks: { id?: string; block_type: ProjectBlockRecord['block_type']; is_hidden: number; content: Record<string, unknown> }[];
}): { project: ProjectRecord; blocks: ProjectBlockRecord[] } {
  const db = getDb();
  const p = input.project;

  const clash = db.prepare('SELECT id FROM projects WHERE slug = ? AND id != ?').get(p.slug, p.id ?? '') as { id: string } | undefined;
  if (clash) throw new SlugTakenError(p.slug);

  const fields = {
    slug: p.slug,
    title: p.title,
    subtitle: p.subtitle || null,
    client: p.client || null,
    year: p.year || null,
    location: p.location || null,
    typology: p.typology || null,
    size: p.size || null,
    status: p.status || null,
    summary: p.summary || null,
    description: p.description || null,
    hero_image_url: p.hero_image_url || null,
    thumbnail_url: p.thumbnail_url || null,
    theme_bg_color: p.theme_bg_color,
    is_featured: p.is_featured,
    status_state: p.status_state,
    model_id: p.model_id,
    bg_mode: p.bg_mode,
    bg_image_url: p.bg_image_url || null,
    bg_dim: p.bg_dim,
    custom_metadata_json: JSON.stringify(p.custom_metadata),
  };

  db.exec('BEGIN');
  try {
    let id = p.id;
    if (id && getProjectById(id)) {
      updateProject(id, fields);
    } else {
      const next = db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM projects').get() as { n: number };
      id = createProject({ ...fields, id, sort_order: Number(next.n) }).id;
    }
    const now = new Date().toISOString();
    const blocks = saveBlocksForProject(
      id,
      input.blocks.map((b, i) => ({
        id: b.id && !b.id.startsWith('new_') ? b.id : '',
        block_type: b.block_type,
        sort_order: i,
        is_hidden: b.is_hidden,
        content_json: JSON.stringify(b.content),
        created_at: now,
      }))
    );
    db.exec('COMMIT');
    return { project: getProjectById(id)!, blocks };
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// ----------------- CONTENT BLOCKS -----------------

export function getBlocksByProjectId(projectId: string, includeHidden = false): ProjectBlockRecord[] {
  const db = getDb();
  let query = 'SELECT * FROM project_blocks WHERE project_id = ?';
  if (!includeHidden) {
    query += ' AND is_hidden = 0';
  }
  query += ' ORDER BY sort_order ASC';

  const stmt = db.prepare(query);
  return toPlain(stmt.all(projectId) as unknown as ProjectBlockRecord[]);
}

export function saveBlocksForProject(projectId: string, blocks: Omit<ProjectBlockRecord, 'project_id'>[]): ProjectBlockRecord[] {
  const db = getDb();
  db.prepare('DELETE FROM project_blocks WHERE project_id = ?').run(projectId);

  const insertStmt = db.prepare(`
    INSERT INTO project_blocks (id, project_id, block_type, sort_order, is_hidden, content_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  blocks.forEach((b, index) => {
    const id = b.id || 'blk_' + Math.random().toString(36).substring(2, 11);
    insertStmt.run(
      id,
      projectId,
      b.block_type,
      index,
      b.is_hidden ? 1 : 0,
      typeof b.content_json === 'string' ? b.content_json : JSON.stringify(b.content_json),
      b.created_at || now
    );
  });

  return getBlocksByProjectId(projectId, true);
}

// ----------------- GLOBAL SETTINGS -----------------

const DEFAULT_SETTINGS: GlobalSettings = {
  companyName: 'CVI Architects',
  tagline: 'Architectural Tectonics & Urban Vision',
  legalName: 'CVI Architects Ltd.',
  addressLine1: 'Al-Wuzara Street (Ministers St)',
  addressLine2: 'Al-Jadriya, Baghdad, Iraq',
  latitude: 33.2905386,
  longitude: 44.3923889,
  email: 'info@cvi-iq.com',
  phone: '+964 781 997 5070',
  facebookUrl: 'https://www.facebook.com/profile.php?id=61578697355535',
  instagramUrl: 'https://www.instagram.com/cvi.arch/',
  twitterUrl: 'https://x.com/CVIarch',
  linkedinUrl: 'https://iq.linkedin.com/in/cvi-undefined-a939ab32a',
  copyrightText: 'Legal and policies © 2026 CVI Architects. All Rights Reserved.',
  defaultSeoTitle: 'CVI Architects · Baghdad · International Architectural Practice',
  defaultSeoDescription: 'Avant-garde architectural design, masterplanning, 3D visualization, BIM, and structural engineering based in Baghdad, Iraq.',
  defaultOgImage: '/baghdad-urban-map.jpg',
  manifesto: 'At CVI, we believe architecture is a dialogue between computational geometry and cultural memory. We design with purpose—balancing aesthetics, climatic sustainability, and future-ready engineering.',
};

export function getSettings(): GlobalSettings {
  const db = getDb();
  const stmt = db.prepare('SELECT value_json FROM global_settings WHERE key = ?');
  const row = stmt.get('site_settings') as { value_json: string } | undefined;
  if (!row) {
    updateSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(row.value_json) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function updateSettings(updates: Partial<GlobalSettings>): GlobalSettings {
  const db = getDb();
  const current = getSettings();
  const merged = { ...current, ...updates };
  const stmt = db.prepare(`
    INSERT INTO global_settings (key, value_json, updated_at)
    VALUES ('site_settings', ?, ?)
    ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
  `);
  stmt.run(JSON.stringify(merged), new Date().toISOString());
  return merged;
}

// ----------------- NAVIGATION -----------------

export function getNavigationItems(onlyVisible = false): NavigationItemRecord[] {
  const db = getDb();
  let query = 'SELECT * FROM navigation_items';
  if (onlyVisible) {
    query += ' WHERE is_visible = 1';
  }
  query += ' ORDER BY sort_order ASC';
  return toPlain(db.prepare(query).all() as unknown as NavigationItemRecord[]);
}

export function saveNavigationItems(items: NavigationItemRecord[]): NavigationItemRecord[] {
  const db = getDb();
  db.prepare('DELETE FROM navigation_items').run();

  const insert = db.prepare(`
    INSERT INTO navigation_items (id, label, href, hint, sort_order, is_visible, is_external)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  items.forEach((item, index) => {
    insert.run(
      item.id || 'nav_' + (index + 1),
      item.label,
      item.href,
      item.hint || null,
      index,
      item.is_visible ? 1 : 0,
      item.is_external ? 1 : 0
    );
  });

  return getNavigationItems(false);
}

// ----------------- MEDIA ASSETS -----------------

export function getMediaAssets(): MediaAssetRecord[] {
  const db = getDb();
  return toPlain(db.prepare('SELECT * FROM media_assets ORDER BY created_at DESC').all() as unknown as MediaAssetRecord[]);
}

export function createMediaAsset(asset: Omit<MediaAssetRecord, 'id' | 'created_at'> & { id?: string }): MediaAssetRecord {
  const db = getDb();
  const id = asset.id || 'med_' + Math.random().toString(36).substring(2, 11);
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO media_assets (
      id, filename, url, mime_type, size_bytes, width, height, alt_text, caption, credit, focal_point_x, focal_point_y, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    asset.filename,
    asset.url,
    asset.mime_type,
    asset.size_bytes,
    asset.width || 0,
    asset.height || 0,
    asset.alt_text || '',
    asset.caption || '',
    asset.credit || '',
    asset.focal_point_x ?? 0.5,
    asset.focal_point_y ?? 0.5,
    now
  );

  return toPlain(db.prepare('SELECT * FROM media_assets WHERE id = ?').get(id) as unknown as MediaAssetRecord);
}

export function deleteMediaAsset(id: string): boolean {
  const db = getDb();
  db.prepare('DELETE FROM media_assets WHERE id = ?').run(id);
  return true;
}

// ----------------- TEAM MEMBERS & DISCIPLINES -----------------

export function getTeamMembers(onlyVisible = false): TeamMemberRecord[] {
  const db = getDb();
  const where = onlyVisible ? ' WHERE is_visible = 1' : '';
  return toPlain(db.prepare(`SELECT * FROM team_members${where} ORDER BY sort_order ASC`).all() as unknown as TeamMemberRecord[]);
}

export function getTeamMemberById(id: string): TeamMemberRecord | null {
  const db = getDb();
  return toPlain((db.prepare('SELECT * FROM team_members WHERE id = ?').get(id) as unknown as TeamMemberRecord) || null);
}

export type TeamMemberInput = Omit<TeamMemberRecord, 'id' | 'sort_order'>;

export function createTeamMember(m: TeamMemberInput): TeamMemberRecord {
  const db = getDb();
  const id = newId('tm');
  const next = db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM team_members').get() as { n: number };
  db.prepare(`
    INSERT INTO team_members (id, name, role, department, bio, avatar_url, sort_order, is_leadership, is_visible)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, m.name, m.role, m.department, m.bio, m.avatar_url, Number(next.n), m.is_leadership ? 1 : 0, m.is_visible ? 1 : 0);
  return getTeamMemberById(id)!;
}

export function updateTeamMember(id: string, m: Partial<TeamMemberInput>): TeamMemberRecord | null {
  const existing = getTeamMemberById(id);
  if (!existing) return null;
  const u = { ...existing, ...m };
  getDb()
    .prepare(`
      UPDATE team_members SET name = ?, role = ?, department = ?, bio = ?, avatar_url = ?, is_leadership = ?, is_visible = ?
      WHERE id = ?
    `)
    .run(u.name, u.role, u.department, u.bio, u.avatar_url, u.is_leadership ? 1 : 0, u.is_visible ? 1 : 0, id);
  return getTeamMemberById(id);
}

export function deleteTeamMember(id: string): boolean {
  const res = getDb().prepare('DELETE FROM team_members WHERE id = ?').run(id);
  return Number(res.changes) > 0;
}

export function reorderTeamMembers(ids: string[]): void {
  const db = getDb();
  const stmt = db.prepare('UPDATE team_members SET sort_order = ? WHERE id = ?');
  db.exec('BEGIN');
  try {
    ids.forEach((id, i) => stmt.run(i, id));
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function getDisciplines(): DisciplineRecord[] {
  const db = getDb();
  return toPlain(db.prepare('SELECT * FROM disciplines ORDER BY sort_order ASC').all() as unknown as DisciplineRecord[]);
}

export type DisciplineInput = Omit<DisciplineRecord, 'id' | 'sort_order'>;

/** Replace the whole discipline list in one transaction (order = array order). */
export function saveDisciplines(items: (DisciplineInput & { id?: string })[]): DisciplineRecord[] {
  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO disciplines (id, title, tagline, description, image_url, sort_order) VALUES (?, ?, ?, ?, ?, ?)
  `);
  db.exec('BEGIN');
  try {
    db.prepare('DELETE FROM disciplines').run();
    items.forEach((d, i) => insert.run(d.id || newId('dsc'), d.title, d.tagline ?? null, d.description, d.image_url, i));
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return getDisciplines();
}

// ----------------- SITE CONTENT -----------------

export const DEFAULT_SITE_CONTENT: SiteContent = {
  ...COPY_DEFAULTS,
  heroStats: DEFAULT_HERO_STATS,
  heroEyebrow: 'International Architectural Practice',
  heroTitle: 'Computational Geometry.',
  heroTitleMuted: 'Monumental Form.',
  heroBody:
    'Headquartered in Baghdad, CVI Architects synthesizes computational masterplanning, climatic responsiveness, and tectonic authenticity into visionary built environments across Iraq.',
  manifestoQuote:
    'We shape spaces that balance tectonic precision with cultural memory, giving human communities durable sanctuaries in an evolving world.',
  manifestoAttribution: 'CVI ARCHITECTS • AL-JADRIYA DESIGN STUDIOS',
  teamEyebrow: 'The Studio',
  teamTitle: 'The People Behind the Work',
  teamIntro:
    'Architects, engineers and visualisers working together from our Baghdad atelier — from first sketch to site supervision.',
  aboutEyebrow: 'BAGHDAD ATELIER • ESTABLISHED PRACTICE',
  aboutTitle: 'Shaping Spaces That Inspire, Endure & Transform',
  aboutBody:
    'At CVI, we are an international atelier of architectural designers, computational researchers, and structural engineers committed to shaping environments that balance aesthetics, climatic reality, and future-ready intelligence.',
  pillars: [
    {
      title: 'Creative Innovation',
      desc: 'We push the boundaries of traditional design by offering bold, fresh ideas that reflect modern lifestyles and environmental awareness.',
      img: '/brand/Creative Innovation2.jpg',
    },
    {
      title: 'Client-Focused Process',
      desc: 'Your vision is our foundation. We take time to listen, understand your needs, and design customized spaces that align with your strategic goals.',
      img: '/brand/Client-Focused Process.jpg',
    },
    {
      title: 'Sustainable Design',
      desc: 'We care about the future. Our designs aim to be environmentally conscious, energy-efficient, and adaptable for long-term endurance in arid climates.',
      img: '/brand/Sustainable Design.jpg',
    },
    {
      title: 'Excellence in Detail',
      desc: 'Every line we draw is deliberate. We believe that great architecture is built on precision, tectonic integrity, and thoughtful craftsmanship.',
      img: '/brand/Excellence in Detail.jpg',
    },
  ],
};

export function getSiteContent(): SiteContent {
  const row = getDb().prepare('SELECT value_json FROM global_settings WHERE key = ?').get('site_content') as
    | { value_json: string }
    | undefined;
  if (!row) return DEFAULT_SITE_CONTENT;
  try {
    return { ...DEFAULT_SITE_CONTENT, ...JSON.parse(row.value_json) };
  } catch {
    return DEFAULT_SITE_CONTENT;
  }
}

export function updateSiteContent(updates: Partial<SiteContent>): SiteContent {
  const merged = { ...getSiteContent(), ...updates };
  getDb()
    .prepare(`
      INSERT INTO global_settings (key, value_json, updated_at) VALUES ('site_content', ?, ?)
      ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
    `)
    .run(JSON.stringify(merged), new Date().toISOString());
  return merged;
}

// ----------------- PAGE LAYOUT (order + visibility of page sections) -----------------

export function getPageLayout(): PageLayout {
  const row = getDb().prepare('SELECT value_json FROM global_settings WHERE key = ?').get('page_layout') as
    | { value_json: string }
    | undefined;
  if (!row) return DEFAULT_PAGE_LAYOUT;
  try {
    return normalizeLayout(JSON.parse(row.value_json));
  } catch {
    return DEFAULT_PAGE_LAYOUT;
  }
}

export function updatePageLayout(layout: unknown): PageLayout {
  const clean = normalizeLayout(layout);
  getDb()
    .prepare(`
      INSERT INTO global_settings (key, value_json, updated_at) VALUES ('page_layout', ?, ?)
      ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
    `)
    .run(JSON.stringify(clean), new Date().toISOString());
  return clean;
}

// ----------------- CONTACT MESSAGES -----------------

export type ContactMessageInput = Pick<ContactMessageRecord, 'name' | 'email' | 'typology' | 'scale' | 'message'>;

export function createContactMessage(m: ContactMessageInput): ContactMessageRecord {
  const db = getDb();
  const id = newId('msg');
  db.prepare(`
    INSERT INTO contact_messages (id, name, email, typology, scale, message, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'new', ?)
  `).run(id, m.name, m.email, m.typology ?? null, m.scale ?? null, m.message, new Date().toISOString());
  return toPlain(db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(id) as unknown as ContactMessageRecord);
}

export function getContactMessages(status?: MessageStatus | 'inbox'): ContactMessageRecord[] {
  const db = getDb();
  if (status === 'inbox') {
    return toPlain(
      db.prepare("SELECT * FROM contact_messages WHERE status != 'archived' ORDER BY created_at DESC").all() as unknown as ContactMessageRecord[]
    );
  }
  if (status) {
    return toPlain(
      db.prepare('SELECT * FROM contact_messages WHERE status = ? ORDER BY created_at DESC').all(status) as unknown as ContactMessageRecord[]
    );
  }
  return toPlain(db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all() as unknown as ContactMessageRecord[]);
}

export function getMessageCounts(): { total: number; unread: number; archived: number } {
  const row = getDb()
    .prepare(`
      SELECT COUNT(*) AS total,
             SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS unread,
             SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) AS archived
      FROM contact_messages
    `)
    .get() as { total: number; unread: number | null; archived: number | null };
  return { total: Number(row.total), unread: Number(row.unread ?? 0), archived: Number(row.archived ?? 0) };
}

export function setMessageStatus(id: string, status: MessageStatus): ContactMessageRecord | null {
  const db = getDb();
  const readAt = status === 'new' ? null : new Date().toISOString();
  db.prepare('UPDATE contact_messages SET status = ?, read_at = COALESCE(read_at, ?) WHERE id = ?').run(status, readAt, id);
  if (status === 'new') db.prepare('UPDATE contact_messages SET read_at = NULL WHERE id = ?').run(id);
  return toPlain((db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(id) as unknown as ContactMessageRecord) || null);
}

export function deleteContactMessage(id: string): boolean {
  const res = getDb().prepare('DELETE FROM contact_messages WHERE id = ?').run(id);
  return Number(res.changes) > 0;
}

// ----------------- ADMIN USERS -----------------

export function getAdminByUsername(username: string): AdminUserRecord | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM admin_users WHERE username = ?');
  return toPlain((stmt.get(username) as unknown as AdminUserRecord) || null);
}

export function createAdminUser(u: Omit<AdminUserRecord, 'id' | 'created_at'> & { id?: string }): AdminUserRecord {
  const db = getDb();
  const id = u.id || 'usr_' + Math.random().toString(36).substring(2, 11);
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO admin_users (id, username, password_hash, name, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, u.username, u.password_hash, u.name, u.role || 'admin', now);
  return toPlain(db.prepare('SELECT * FROM admin_users WHERE id = ?').get(id) as unknown as AdminUserRecord);
}

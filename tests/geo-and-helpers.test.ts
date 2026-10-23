import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { getModel, listModels, MODEL_ID_PATTERN } from '@/lib/models/catalog';
import { SOURCES } from '@/scripts/models/sources.mjs';
import { clientIp, rateLimit } from '@/lib/http/rateLimit';
import { ContactSchema, SiteContentSchema } from '@/lib/validation/schemas';
import { DEFAULT_SITE_CONTENT } from '@/lib/db';
import { ProjectSaveSchema } from '@/lib/validation/project';
import { NavigationSchema } from '@/lib/validation/schemas';
import { COPY_GROUPS, COPY_DEFAULTS, fillCount } from '@/lib/content/copy';

describe('3D model catalog', () => {
  it('has a converted GLB on disk for every supplied FBX', () => {
    for (const s of SOURCES) {
      const model = getModel(s.id);
      expect(model, `${s.id} missing from lib/models/generated.json — run npm run models:build`).not.toBeNull();
      const file = path.join(process.cwd(), 'public', model!.url);
      expect(fs.existsSync(file), `${file} missing`).toBe(true);
      expect(fs.statSync(file).size).toBe(model!.bytes);
    }
  });

  it('keeps every model light enough to stream quickly', () => {
    for (const m of listModels()) expect(m.bytes, m.id).toBeLessThan(6 * 1024 * 1024);
  });

  it('only resolves ids it knows, never a path', () => {
    expect(getModel('budoor-zoo')?.label).toBe('Budoor Zoo');
    expect(getModel('../../etc/passwd')).toBeNull();
    expect(getModel('__proto__')).toBeNull();
    expect(getModel('constructor')).toBeNull();
    expect(getModel(null)).toBeNull();
  });

  it('accepts only plain file-name ids', () => {
    for (const ok of ['budoor-zoo', 'u-my-model-1a2b3c', 'a']) expect(MODEL_ID_PATTERN.test(ok), ok).toBe(true);
    for (const bad of ['', '-x', 'A', 'a/b', '..', 'a b', 'a.glb']) expect(MODEL_ID_PATTERN.test(bad), bad).toBe(false);
  });
});

describe('project save validation', () => {
  const base = { slug: 'al-zareef', title: 'Al-Zareef' };

  it('accepts a minimal project and fills defaults', () => {
    const r = ProjectSaveSchema.safeParse({ project: base, blocks: [] });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.project.status_state).toBe('draft');
      expect(r.data.project.theme_bg_color).toBe('#0a0a0c');
    }
  });

  it.each([
    ['Bad Slug', 'slug'],
    ['trailing-', 'slug'],
    ['', 'slug'],
  ])('rejects the web address %j', (slug, field) => {
    const r = ProjectSaveSchema.safeParse({ project: { ...base, slug }, blocks: [] });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.path.includes(field))).toBe(true);
  });

  it('rejects script-y image links inside story sections', () => {
    const r = ProjectSaveSchema.safeParse({
      project: base,
      blocks: [{ block_type: 'image', content: { url: 'javascript:alert(1)' } }],
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path.join('.')).toBe('blocks.0.content.url');
  });

  it('rejects unknown section types and bad colours', () => {
    expect(ProjectSaveSchema.safeParse({ project: base, blocks: [{ block_type: 'iframe', content: {} }] }).success).toBe(false);
    expect(ProjectSaveSchema.safeParse({ project: { ...base, theme_bg_color: 'red' }, blocks: [] }).success).toBe(false);
  });
});

describe('rate limiting', () => {
  const req = (headers: Record<string, string>) => new Request('http://x/api', { headers });

  it('prefers X-Real-IP, then the right-most forwarded hop', () => {
    expect(clientIp(req({ 'x-real-ip': '1.1.1.1', 'x-forwarded-for': '9.9.9.9' }))).toBe('1.1.1.1');
    expect(clientIp(req({ 'x-forwarded-for': 'spoofed, 2.2.2.2' }))).toBe('2.2.2.2');
    expect(clientIp(req({}))).toBe('unknown');
  });

  it('allows `limit` requests per window then blocks', () => {
    const key = `test-${Math.random()}`;
    const results = Array.from({ length: 4 }, () => rateLimit(key, 3, 60_000));
    expect(results).toEqual([true, true, true, false]);
  });
});

describe('validation schemas', () => {
  it('rejects an incomplete contact brief with per-field messages', () => {
    const r = ContactSchema.safeParse({ name: '', email: 'nope', message: 'hi' });
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path[0]);
      expect(paths).toEqual(expect.arrayContaining(['name', 'email', 'message']));
    }
  });

  it('accepts the default site content and rejects script-y image URLs', () => {
    expect(SiteContentSchema.safeParse(DEFAULT_SITE_CONTENT).success).toBe(true);
    const bad = { ...DEFAULT_SITE_CONTENT, pillars: [{ ...DEFAULT_SITE_CONTENT.pillars[0], img: 'javascript:alert(1)' }] };
    expect(SiteContentSchema.safeParse(bad).success).toBe(false);
  });
});

describe('editable site copy', () => {
  it('declares every key once, within its own length limit', () => {
    const keys = COPY_GROUPS.flatMap((g) => g.fields.map((f) => f.key));
    expect(new Set(keys).size).toBe(keys.length);
    for (const g of COPY_GROUPS) for (const f of g.fields) expect(f.default.length, f.key).toBeLessThanOrEqual(f.max);
  });

  it('is complete and valid with defaults alone', () => {
    const parsed = SiteContentSchema.safeParse({ ...DEFAULT_SITE_CONTENT });
    expect(parsed.success).toBe(true);
    for (const k of Object.keys(COPY_DEFAULTS)) expect(DEFAULT_SITE_CONTENT).toHaveProperty(k);
  });

  it('rejects an unsafe menu-button link and too-long text', () => {
    expect(SiteContentSchema.safeParse({ ...DEFAULT_SITE_CONTENT, navCtaHref: 'javascript:alert(1)' }).success).toBe(false);
    expect(SiteContentSchema.safeParse({ ...DEFAULT_SITE_CONTENT, loaderText: 'WAY TOO LONG' }).success).toBe(false);
  });

  it('fills the project count tokens', () => {
    expect(fillCount('View all {count} projects', 11)).toBe('View all 11 projects');
    expect(fillCount('{projects}', 3)).toBe('3');
  });
});

describe('menu validation', () => {
  const item = { label: 'Home', href: '/' };
  it('accepts site paths and https links', () => {
    expect(NavigationSchema.safeParse({ items: [item, { label: 'Maps', href: 'https://example.com/x' }] }).success).toBe(true);
  });
  it.each(['javascript:alert(1)', '//evil.com', 'http://insecure.com', ''])('rejects the link %j', (href) => {
    expect(NavigationSchema.safeParse({ items: [{ label: 'X', href }] }).success).toBe(false);
  });
  it('needs at least one link', () => {
    expect(NavigationSchema.safeParse({ items: [] }).success).toBe(false);
  });
});

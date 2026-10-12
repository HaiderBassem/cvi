import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { placeForLocation, GEO_PLACES } from '@/lib/geo/places';
import { classifyProject } from '@/components/webgl/MassingFactory';
import { clientIp, rateLimit } from '@/lib/http/rateLimit';
import { ContactSchema, SiteContentSchema } from '@/lib/validation/schemas';
import { DEFAULT_SITE_CONTENT } from '@/lib/db';

describe('placeForLocation', () => {
  it.each([
    ['Iraq - Najaf', 'najaf'],
    ['IRAQ - KARBALA', 'karbala'],
    ['Iraq / Karbala', 'karbala'],
    ['Iraq - Babylon', 'hilla'],
    ['Iraq - Salah ad din', 'tikrit'],
    ['baghdad', 'baghdad'],
  ])('%s → %s', (loc, key) => {
    expect(placeForLocation(loc)?.key).toBe(key);
  });

  it('returns null for unknown or empty locations', () => {
    expect(placeForLocation('Paris')).toBeNull();
    expect(placeForLocation(null)).toBeNull();
  });

  it('has a generated data file for every place', () => {
    for (const p of GEO_PLACES) {
      const file = path.join(process.cwd(), 'public', 'geo', `${p.key}.json`);
      expect(fs.existsSync(file), `${p.key}.json missing — run scripts/geo/build_city_context.py`).toBe(true);
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      expect(data.stats.buildings).toBeGreaterThan(100);
      expect(data.buildings[0].p.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('classifyProject', () => {
  it.each([
    ['Religion', 'Al-Jid mosque', 'mosque'],
    ['residential', 'Client Villa', 'villa'],
    ['commericial', 'Delta Industrial Area', 'industrial'],
    ['Healthcare', 'Amal A-Hayat', 'healthcare'],
    ['Entertainment', 'Budoor Zoo', 'leisure'],
    ['Educational', 'AL-Ghadeer Kindergarten', 'campus'],
    ['Commercial', '606 restaurants', 'pavilion'],
    ['commercial', 'Warith Bank', 'commercial'],
    ['Adminstrative', 'DIYAR MANAGEMENT', 'civic'],
    ['Residential', 'Imam Hassan Complex', 'residential'],
  ])('%s / %s → %s', (typology, title, kind) => {
    expect(classifyProject(typology, title)).toBe(kind);
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

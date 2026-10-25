import { describe, it, expect } from 'vitest';
import {
  ABOUT_SECTIONS,
  DEFAULT_PAGE_LAYOUT,
  HOME_SECTIONS,
  normalizeEntries,
  normalizeLayout,
  visibleIds,
} from '@/lib/content/layout';
import { PageLayoutSchema } from '@/lib/validation/schemas';
import { getDb, getPageLayout, updatePageLayout } from '@/lib/db';

describe('page layout', () => {
  it('defaults to every section, shown, in the designed order', () => {
    expect(DEFAULT_PAGE_LAYOUT.home.map((e) => e.id)).toEqual(HOME_SECTIONS.map((s) => s.id));
    expect(DEFAULT_PAGE_LAYOUT.about.map((e) => e.id)).toEqual(ABOUT_SECTIONS.map((s) => s.id));
    expect(DEFAULT_PAGE_LAYOUT.home.every((e) => e.visible)).toBe(true);
  });

  it('keeps a saved order and visibility', () => {
    const out = normalizeEntries(
      [
        { id: 'archive', visible: true },
        { id: 'intro', visible: false },
      ],
      HOME_SECTIONS,
    );
    expect(out.slice(0, 2)).toEqual([
      { id: 'archive', visible: true },
      { id: 'intro', visible: false },
    ]);
  });

  it('drops unknown and repeated ids and appends sections it has never seen', () => {
    const out = normalizeEntries(
      [
        { id: 'nope', visible: true },
        { id: 'team', visible: true },
        { id: 'team', visible: false },
      ],
      HOME_SECTIONS,
    );
    expect(out.map((e) => e.id).filter((id) => id === 'team')).toHaveLength(1);
    expect(out.find((e) => e.id === 'team')?.visible).toBe(true);
    expect(out).toHaveLength(HOME_SECTIONS.length);
    expect(out.every((e) => e.id !== ('nope' as never))).toBe(true);
  });

  it('survives garbage input', () => {
    expect(normalizeLayout(null)).toEqual(DEFAULT_PAGE_LAYOUT);
    expect(normalizeLayout('x')).toEqual(DEFAULT_PAGE_LAYOUT);
    expect(normalizeLayout({ home: 5, about: [1, null, 'a'] })).toEqual(DEFAULT_PAGE_LAYOUT);
  });

  it('lists only the visible sections, in order', () => {
    expect(
      visibleIds([
        { id: 'a', visible: true },
        { id: 'b', visible: false },
        { id: 'c', visible: true },
      ]),
    ).toEqual(['a', 'c']);
  });

  it('validates the shape that the admin sends', () => {
    expect(PageLayoutSchema.safeParse(DEFAULT_PAGE_LAYOUT).success).toBe(true);
    expect(PageLayoutSchema.safeParse({ home: [{ id: 'intro' }], about: [] }).success).toBe(false);
  });

  it('saves and reloads a layout (restoring the live value afterwards)', () => {
    const db = getDb();
    const before = db.prepare("SELECT value_json, updated_at FROM global_settings WHERE key = 'page_layout'").get() as
      | { value_json: string; updated_at: string }
      | undefined;
    try {
      const reversed = { home: [...DEFAULT_PAGE_LAYOUT.home].reverse().map((e, i) => ({ ...e, visible: i !== 0 })), about: DEFAULT_PAGE_LAYOUT.about };
      const saved = updatePageLayout(reversed);
      expect(saved.home[0].id).toBe('archive');
      expect(saved.home[0].visible).toBe(false);
      expect(getPageLayout()).toEqual(saved);
    } finally {
      if (before) {
        db.prepare("UPDATE global_settings SET value_json = ?, updated_at = ? WHERE key = 'page_layout'").run(before.value_json, before.updated_at);
      } else {
        db.prepare("DELETE FROM global_settings WHERE key = 'page_layout'").run();
      }
    }
  });
});

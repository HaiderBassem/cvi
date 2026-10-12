import { describe, it, expect } from 'vitest';
import { breadcrumbsFor, isActivePath, pageTitleFor, NAV_GROUPS } from '@/lib/admin/adminNav';

describe('admin navigation', () => {
  it('only marks Overview active on /admin itself', () => {
    expect(isActivePath('/admin', '/admin')).toBe(true);
    expect(isActivePath('/admin/projects', '/admin')).toBe(false);
  });

  it('marks a section active for its sub-pages', () => {
    expect(isActivePath('/admin/projects/abc', '/admin/projects')).toBe(true);
    expect(isActivePath('/admin/projectsX', '/admin/projects')).toBe(false);
  });

  it('builds group / section / leaf breadcrumbs', () => {
    expect(breadcrumbsFor('/admin')).toEqual([{ label: 'Overview' }]);
    expect(breadcrumbsFor('/admin/team')).toEqual([{ label: 'Website' }, { label: 'Team' }]);
    expect(breadcrumbsFor('/admin/projects/new')).toEqual([
      { label: 'Portfolio' },
      { label: 'Projects', to: '/admin/projects' },
      { label: 'New' },
    ]);
    expect(breadcrumbsFor('/admin/projects/cvi_123')).toEqual([
      { label: 'Portfolio' },
      { label: 'Projects', to: '/admin/projects' },
      { label: 'Edit' },
    ]);
  });

  it('falls back safely for unknown sections', () => {
    expect(breadcrumbsFor('/admin/nope')).toEqual([{ label: 'Admin' }]);
    expect(pageTitleFor('/admin/messages')).toBe('Messages');
  });

  it('every nav path is unique', () => {
    const paths = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.path));
    expect(new Set(paths).size).toBe(paths.length);
  });
});

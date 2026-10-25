/**
 * The admin information architecture: which sections exist, where they live,
 * and how a URL maps to a breadcrumb trail. Kept free of React so it is tested directly.
 */

export type NavIconName =
  | 'overview'
  | 'projects'
  | 'media'
  | 'site'
  | 'layout'
  | 'team'
  | 'messages'
  | 'navigation'
  | 'seo'
  | 'settings';

export interface NavItem {
  label: string;
  path: string;
  icon: NavIconName;
}

export interface NavGroup {
  /** Null renders the group without a heading (the Overview link). */
  label: string | null;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  { label: null, items: [{ label: 'Overview', path: '/admin', icon: 'overview' }] },
  {
    label: 'Portfolio',
    items: [
      { label: 'Projects', path: '/admin/projects', icon: 'projects' },
      { label: 'Media library', path: '/admin/media', icon: 'media' },
    ],
  },
  {
    label: 'Website',
    items: [
      { label: 'Site content', path: '/admin/site', icon: 'site' },
      { label: 'Page layout', path: '/admin/layout', icon: 'layout' },
      { label: 'Team', path: '/admin/team', icon: 'team' },
      { label: 'Messages', path: '/admin/messages', icon: 'messages' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Menu & navigation', path: '/admin/navigation', icon: 'navigation' },
      { label: 'Search & SEO', path: '/admin/seo', icon: 'seo' },
      { label: 'Studio settings', path: '/admin/settings', icon: 'settings' },
    ],
  },
];

export interface Crumb {
  label: string;
  /** Absent on the current page. */
  to?: string;
}

const SECTIONS: Record<string, { label: string; group: string | null }> = {
  projects: { label: 'Projects', group: 'Portfolio' },
  media: { label: 'Media library', group: 'Portfolio' },
  site: { label: 'Site content', group: 'Website' },
  layout: { label: 'Page layout', group: 'Website' },
  team: { label: 'Team', group: 'Website' },
  messages: { label: 'Messages', group: 'Website' },
  navigation: { label: 'Menu & navigation', group: 'Settings' },
  seo: { label: 'Search & SEO', group: 'Settings' },
  settings: { label: 'Studio settings', group: 'Settings' },
};

/** True when `pathname` is the nav item's page or anything beneath it. Overview only matches itself. */
export function isActivePath(pathname: string, itemPath: string): boolean {
  if (itemPath === '/admin') return pathname === '/admin';
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

/** Breadcrumb trail for an /admin URL, e.g. Portfolio / Projects / Edit. */
export function breadcrumbsFor(pathname: string): Crumb[] {
  const parts = pathname.split('/').filter(Boolean); // ['admin', 'projects', ':id']
  const section = parts[1];
  if (!section) return [{ label: 'Overview' }];

  const meta = SECTIONS[section];
  if (!meta) return [{ label: 'Admin' }];

  const trail: Crumb[] = [];
  if (meta.group) trail.push({ label: meta.group });

  const rest = parts.slice(2);
  if (rest.length === 0) {
    trail.push({ label: meta.label });
    return trail;
  }

  trail.push({ label: meta.label, to: `/admin/${section}` });
  const last = rest[rest.length - 1];
  trail.push({ label: last === 'new' ? 'New' : 'Edit' });
  return trail;
}

/** Last crumb, for the browser tab title. */
export function pageTitleFor(pathname: string): string {
  const trail = breadcrumbsFor(pathname);
  return trail[trail.length - 1].label;
}

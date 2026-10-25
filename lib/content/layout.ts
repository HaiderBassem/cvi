/**
 * The building blocks of the public pages, and the order they appear in.
 *
 * Which sections exist is fixed in code (each one is a designed component); what the studio
 * controls, from Admin → Page layout, is the ORDER of the sections on the Home and About pages
 * and whether each one is SHOWN. The saved layout is always normalised against the list below,
 * so adding a section later never breaks a layout that was saved earlier.
 */

export interface SectionInfo {
  id: string;
  label: string;
  /** What visitors see in this section. */
  description: string;
  /** Where its words and pictures are edited. */
  editHint: string;
  editHref: string;
}

export const HOME_SECTIONS = [
  {
    id: 'intro',
    label: 'Introduction',
    description: 'The first screen: the big outlined headline, the intro line and the two buttons, on the blueprint sheet.',
    editHint: 'Words: Site content → Homepage',
    editHref: '/admin/site',
  },
  {
    id: 'drawing',
    label: 'Drawing board',
    description: 'The scroll scene where a hand draws a building line by line, with its three steps.',
    editHint: 'Words: Site content → Homepage → Drawing section',
    editHref: '/admin/site',
  },
  {
    id: 'glance',
    label: 'Studio at a glance',
    description: 'The intro paragraph, the key facts and the framed featured project.',
    editHint: 'Facts: Site content → Homepage. Pictures: Projects (featured)',
    editHref: '/admin/site',
  },
  {
    id: 'featured',
    label: 'Featured projects',
    description: 'Large project stories with their picture, place, year and size.',
    editHint: 'Projects: Projects → mark as featured',
    editHref: '/admin/projects',
  },
  {
    id: 'manifesto',
    label: 'Studio quote',
    description: 'A single large quotation with its attribution.',
    editHint: 'Words: Site content → Homepage',
    editHref: '/admin/site',
  },
  {
    id: 'services',
    label: 'Services',
    description: 'The disciplines the studio offers, as picture cards.',
    editHint: 'Cards: Site content → Services',
    editHref: '/admin/site',
  },
  {
    id: 'team',
    label: 'Team',
    description: 'The people behind the work (hidden automatically when nobody is visible).',
    editHint: 'People: Team',
    editHref: '/admin/team',
  },
  {
    id: 'archive',
    label: 'All projects list',
    description: 'A compact index of recent projects with a link to the full archive.',
    editHint: 'Projects: Projects',
    editHref: '/admin/projects',
  },
] as const satisfies readonly SectionInfo[];

export const ABOUT_SECTIONS = [
  {
    id: 'statement',
    label: 'Opening statement',
    description: 'The eyebrow, big headline and introduction at the top of the page.',
    editHint: 'Words: Site content → About page',
    editHref: '/admin/site',
  },
  {
    id: 'image',
    label: 'Atelier picture',
    description: 'A wide studio picture with a caption.',
    editHint: 'Picture and caption: Site content → About page',
    editHref: '/admin/site',
  },
  {
    id: 'pillars',
    label: 'Design pillars',
    description: 'The cards describing what sets the studio apart.',
    editHint: 'Cards: Site content → About page',
    editHref: '/admin/site',
  },
  {
    id: 'services',
    label: 'Disciplines',
    description: "The studio's services, with pictures.",
    editHint: 'Cards: Site content → Services',
    editHref: '/admin/site',
  },
  {
    id: 'team',
    label: 'Team',
    description: 'The leadership and team cards (hidden automatically when nobody is visible).',
    editHint: 'People: Team',
    editHref: '/admin/team',
  },
  {
    id: 'cta',
    label: 'Contact invitation',
    description: 'The closing call to action with a button to the contact page.',
    editHint: 'Words: Site content → About page',
    editHref: '/admin/site',
  },
] as const satisfies readonly SectionInfo[];

export type HomeSectionId = (typeof HOME_SECTIONS)[number]['id'];
export type AboutSectionId = (typeof ABOUT_SECTIONS)[number]['id'];

export interface LayoutEntry<Id extends string = string> {
  id: Id;
  visible: boolean;
}

export interface PageLayout {
  home: LayoutEntry<HomeSectionId>[];
  about: LayoutEntry<AboutSectionId>[];
}

export const DEFAULT_PAGE_LAYOUT: PageLayout = {
  home: HOME_SECTIONS.map((s) => ({ id: s.id, visible: true })),
  about: ABOUT_SECTIONS.map((s) => ({ id: s.id, visible: true })),
};

/**
 * Makes any saved list safe to render: keeps the saved order, drops unknown or repeated ids,
 * and appends sections that did not exist when it was saved (shown, at the end).
 */
export function normalizeEntries<Id extends string>(raw: unknown, known: readonly { id: Id }[]): LayoutEntry<Id>[] {
  const knownIds = new Set<string>(known.map((k) => k.id));
  const seen = new Set<string>();
  const out: LayoutEntry<Id>[] = [];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!item || typeof item !== 'object') continue;
      const id = (item as { id?: unknown }).id;
      if (typeof id !== 'string' || !knownIds.has(id) || seen.has(id)) continue;
      seen.add(id);
      out.push({ id: id as Id, visible: (item as { visible?: unknown }).visible !== false });
    }
  }
  for (const k of known) if (!seen.has(k.id)) out.push({ id: k.id, visible: true });
  return out;
}

export function normalizeLayout(raw: unknown): PageLayout {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    home: normalizeEntries(obj.home, HOME_SECTIONS),
    about: normalizeEntries(obj.about, ABOUT_SECTIONS),
  };
}

/** The ids to render, in order, skipping hidden ones. */
export function visibleIds<Id extends string>(entries: readonly LayoutEntry<Id>[]): Id[] {
  return entries.filter((e) => e.visible).map((e) => e.id);
}

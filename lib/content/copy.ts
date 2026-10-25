/**
 * Every piece of public-site text that is edited from Admin → Site content, declared once.
 * This list drives: the defaults, the server-side validation, the admin form and the TypeScript
 * type of `SiteContent` — so adding an editable text is one line here plus using it on a page.
 *
 * (The homepage hero, studio quote, team heading, About opening and design pillars predate this
 * list and have their own, richer editors; they are not repeated here.)
 */

export type CopyKind = 'text' | 'textarea' | 'image';

export interface CopyField {
  key: string;
  label: string;
  kind: CopyKind;
  max: number;
  default: string;
  hint?: string;
}

export interface CopyGroup {
  /** Which tab of the admin page shows this group. */
  tab: 'home' | 'pages' | 'about' | 'footer';
  title: string;
  description?: string;
  fields: readonly CopyField[];
}

export const COPY_GROUPS = [
  // ---------------------------------------------------------------- Homepage
  {
    tab: 'home',
    title: 'Hero buttons',
    description: 'The two buttons under the introduction, and the hint at the bottom.',
    fields: [
      { key: 'heroPrimaryCta', label: 'First button', kind: 'text', max: 40, default: 'See our projects' },
      { key: 'heroSecondaryCta', label: 'Second button', kind: 'text', max: 40, default: 'About us' },
      { key: 'heroScrollCue', label: 'Scroll hint', kind: 'text', max: 60, default: 'Scroll to see our work' },
    ],
  },
  {
    tab: 'home',
    title: 'Drawing section',
    description: 'The scroll scene where a hand draws a building, shown right after the introduction.',
    fields: [
      { key: 'sketchEyebrow', label: 'Handwritten note above the heading', kind: 'text', max: 50, default: 'The drawing board' },
      { key: 'sketchTitle', label: 'Heading', kind: 'text', max: 70, default: 'Drawn by hand. Built with precision.' },
      { key: 'sketchNote', label: 'Handwritten note on the drawing', kind: 'text', max: 30, default: 'scale 1 : 200' },
      { key: 'sketchStep1Title', label: 'Step 1 — title', kind: 'text', max: 40, default: 'Sketch the idea' },
      { key: 'sketchStep1Text', label: 'Step 1 — text', kind: 'textarea', max: 200, default: 'Every project starts as a few lines on paper: the site, the axis, the proportions.' },
      { key: 'sketchStep2Title', label: 'Step 2 — title', kind: 'text', max: 40, default: 'Draw the structure' },
      { key: 'sketchStep2Text', label: 'Step 2 — text', kind: 'textarea', max: 200, default: 'Arches, floors and fins take their place, line by line, long before any model exists.' },
      { key: 'sketchStep3Title', label: 'Step 3 — title', kind: 'text', max: 40, default: 'Detail and dimension' },
      { key: 'sketchStep3Text', label: 'Step 3 — text', kind: 'textarea', max: 200, default: 'Shade, people and measurements turn a drawing into something that can be built.' },
    ],
  },
  {
    tab: 'home',
    title: 'Featured projects section',
    fields: [
      { key: 'featuredEyebrow', label: 'Small label', kind: 'text', max: 60, default: '01 • Featured projects' },
      { key: 'featuredTitle', label: 'Heading', kind: 'text', max: 80, default: 'Our featured work' },
      { key: 'featuredIntro', label: 'Short line on the right', kind: 'text', max: 200, default: 'Curated architectural case studies with high-density visual narratives.' },
      { key: 'cardCta', label: 'Link under each project', kind: 'text', max: 40, default: 'View project' },
      { key: 'cardScaleLabel', label: 'Label above the size', kind: 'text', max: 30, default: 'Built scale' },
      { key: 'cardPhaseLabel', label: 'Label above the phase', kind: 'text', max: 30, default: 'Phase' },
    ],
  },
  {
    tab: 'home',
    title: 'Studio quote section',
    fields: [{ key: 'manifestoEyebrow', label: 'Small label above the quote', kind: 'text', max: 60, default: 'Our belief' }],
  },
  {
    tab: 'home',
    title: 'Services section',
    description: 'The cards come from the Disciplines tab.',
    fields: [
      { key: 'servicesEyebrow', label: 'Small label', kind: 'text', max: 60, default: '02 • What we do' },
      { key: 'servicesTitle', label: 'Heading', kind: 'text', max: 80, default: 'Our services' },
      { key: 'servicesIntro', label: 'Short line on the right', kind: 'text', max: 200, default: 'Full-spectrum architectural delivery from schematic inception to structural coordination.' },
    ],
  },
  {
    tab: 'home',
    title: 'All-projects list',
    fields: [
      { key: 'archiveEyebrow', label: 'Small label', kind: 'text', max: 60, default: '04 • All work' },
      { key: 'archiveTitle', label: 'Heading', kind: 'text', max: 80, default: 'More projects' },
      { key: 'archiveLink', label: 'Link text', kind: 'text', max: 60, default: 'View all {count} projects', hint: '{count} is replaced by the number of projects.' },
    ],
  },

  // ---------------------------------------------------------- Other pages
  {
    tab: 'pages',
    title: 'Projects page',
    fields: [
      { key: 'projectsEyebrow', label: 'Small label', kind: 'text', max: 80, default: 'Portfolio • 2023 — 2026' },
      { key: 'projectsTitle', label: 'Heading', kind: 'text', max: 80, default: 'Architectural Works' },
      {
        key: 'projectsIntro',
        label: 'Introduction',
        kind: 'textarea',
        max: 500,
        default:
          'A curated selection of masterplans, residential towers, educational campuses and civic buildings designed across Iraq.',
      },
      { key: 'projectsAllLabel', label: 'Label of the “show everything” filter', kind: 'text', max: 40, default: 'All types' },
    ],
  },
  {
    tab: 'pages',
    title: 'Individual project pages',
    description: 'Small texts that appear on every project page.',
    fields: [
      { key: 'projectBgDefault', label: 'Default background picture', kind: 'image', max: 500, default: '/baghdad-urban-map.jpg', hint: 'Used behind every project that has no background or cover picture of its own.' },
      { key: 'projectBackLabel', label: 'Link back to the list', kind: 'text', max: 40, default: 'All projects' },
      { key: 'projectReadCue', label: 'Hint under the title', kind: 'text', max: 40, default: 'Read the project' },
      { key: 'projectNextTitle', label: 'Heading before the next project', kind: 'text', max: 40, default: 'Continue exploring' },
      { key: 'projectNextLabel', label: 'Label on the next-project card', kind: 'text', max: 40, default: 'Next project' },
    ],
  },
  {
    tab: 'pages',
    title: 'Contact page',
    fields: [
      { key: 'contactEyebrow', label: 'Small label', kind: 'text', max: 80, default: 'Contact us • Baghdad' },
      { key: 'contactTitle', label: 'Heading', kind: 'text', max: 80, default: 'Start a conversation' },
      {
        key: 'contactIntro',
        label: 'Introduction',
        kind: 'textarea',
        max: 500,
        default:
          'We welcome conversations with developers, civic leaders and private clients seeking architectural innovation and lasting quality.',
      },
    ],
  },

  // ----------------------------------------------------------- About page
  {
    tab: 'about',
    title: 'About page: picture',
    fields: [
      { key: 'aboutImage', label: 'Studio picture', kind: 'image', max: 500, default: '/brand/who are we.jpg' },
      { key: 'aboutImageCaption', label: 'Caption on the picture', kind: 'text', max: 100, default: 'Al-Jadriya design studios • Baghdad' },
    ],
  },
  {
    tab: 'about',
    title: 'About page: section headings',
    fields: [
      { key: 'pillarsEyebrow', label: 'Pillars: small label', kind: 'text', max: 60, default: 'Design philosophy' },
      { key: 'pillarsTitle', label: 'Pillars: heading', kind: 'text', max: 80, default: 'What sets us apart' },
      { key: 'aboutServicesEyebrow', label: 'Services: small label', kind: 'text', max: 60, default: 'Integrated capabilities' },
      { key: 'aboutServicesTitle', label: 'Services: heading', kind: 'text', max: 80, default: 'Disciplines & engineering' },
      { key: 'leadershipEyebrow', label: 'Leadership: small label', kind: 'text', max: 60, default: 'Design directors' },
      { key: 'leadershipTitle', label: 'Leadership: heading', kind: 'text', max: 80, default: 'Studio leadership' },
    ],
  },
  {
    tab: 'about',
    title: 'About page: closing call to action',
    fields: [
      { key: 'aboutCtaTitle', label: 'Heading', kind: 'text', max: 100, default: 'Collaborate with our Baghdad atelier' },
      {
        key: 'aboutCtaBody',
        label: 'Text',
        kind: 'textarea',
        max: 300,
        default: 'We partner with institutional leaders, commercial developers and private clients across Iraq and the Middle East.',
      },
      { key: 'aboutCtaButton', label: 'Button', kind: 'text', max: 40, default: 'Start a conversation' },
    ],
  },

  // ------------------------------------------------- Menu, footer, loader
  {
    tab: 'footer',
    title: 'Menu bar',
    description: 'The links themselves are managed under Menu & navigation.',
    fields: [
      { key: 'brandSubtitle', label: 'Small line under the studio name', kind: 'text', max: 40, default: 'Baghdad Atelier' },
      { key: 'navCtaLabel', label: 'Button on the right', kind: 'text', max: 30, default: 'Start a project' },
      { key: 'navCtaHref', label: 'Where the button goes', kind: 'text', max: 200, default: '/contact', hint: 'A page of this site (for example /contact) or a full https:// link.' },
    ],
  },
  {
    tab: 'footer',
    title: 'Footer',
    description: 'Address, phone, email and social links come from Studio settings.',
    fields: [
      {
        key: 'footerBlurb',
        label: 'About line',
        kind: 'textarea',
        max: 300,
        default: 'International architectural, computational and structural practice headquartered in Baghdad, Iraq.',
      },
      { key: 'footerMenuTitle', label: 'Heading above the links', kind: 'text', max: 30, default: 'Menu' },
      { key: 'footerStudioTitle', label: 'Heading above the address', kind: 'text', max: 30, default: 'Our studio' },
      { key: 'footerBackToTop', label: '“Back to top” text', kind: 'text', max: 30, default: 'Back to top' },
    ],
  },
  {
    tab: 'footer',
    title: 'Opening screen',
    description: 'The screen shown for a moment when the site opens: a hand draws these letters, then the sheet slides up.',
    fields: [
      { key: 'loaderText', label: 'Letters in the middle', kind: 'text', max: 8, default: 'CVI', hint: 'Up to 8 characters. CVI is drawn from the real studio logo; other letters and numbers are drawn in a single-line pencil alphabet.' },
      { key: 'loaderImage', label: 'Background picture (no longer used)', kind: 'image', max: 500, default: '/brand/loader-map.jpg', hint: 'The opening screen is now a plain cream drafting sheet, so this picture is not shown.' },
    ],
  },
] as const satisfies readonly CopyGroup[];

export type CopyKey = (typeof COPY_GROUPS)[number]['fields'][number]['key'];

/** Defaults for every declared field. */
export const COPY_DEFAULTS = Object.fromEntries(COPY_GROUPS.flatMap((g) => g.fields.map((f) => [f.key, f.default]))) as Record<CopyKey, string>;

/** A big number or word with a caption, shown in the homepage hero. `{projects}` becomes the project count. */
export interface SiteStat {
  value: string;
  label: string;
}

export const DEFAULT_HERO_STATS: SiteStat[] = [
  { value: '500,000+', label: 'm² masterplanned' },
  { value: '{projects}', label: 'projects in the archive' },
  { value: 'Baghdad', label: 'Al-Jadriya atelier' },
];

/** Fills the {projects} / {count} tokens. */
export const fillCount = (text: string, count: number) => text.replace(/\{(?:projects|count)\}/g, String(count));

import { z } from 'zod';
import { COPY_GROUPS, type CopyKey } from '../content/copy';

/** Shared by the API routes and the admin forms, so both sides agree on the rules. */

const trimmed = (max: number, label: string) =>
  z.string().trim().max(max, `${label} must be ${max} characters or fewer.`);

const required = (max: number, label: string) => trimmed(max, label).min(1, `${label} is required.`);

/** Site-relative path (/uploads/…, /brand/…) or an https URL. */
const isImageUrl = (v: string) => /^\/(?!\/)[\w\-./ %()]+$/.test(v) || /^https:\/\/[^\s]+$/.test(v);
const IMAGE_URL_MESSAGE = 'Use an uploaded image or an https:// link.';

export const imageUrl = z.string().trim().min(1, 'Add an image.').max(500).refine(isImageUrl, IMAGE_URL_MESSAGE);

/** Like `imageUrl`, but an empty value is fine (the picture is optional). */
const optionalImageUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || isImageUrl(v), IMAGE_URL_MESSAGE);

/** One side of a person's rectangle on the group photo, in % of the photo. */
const photoPercent = z.number().min(0, 'Draw the box inside the photo.').max(100, 'Draw the box inside the photo.').nullable().optional();

export const ContactSchema = z.object({
  name: required(120, 'Name'),
  email: z.string().trim().max(200).email('Enter a valid email address.'),
  typology: trimmed(120, 'Project type').optional().default(''),
  scale: trimmed(120, 'Scale').optional().default(''),
  message: z
    .string()
    .trim()
    .min(10, 'Tell us a little more (at least 10 characters).')
    .max(5000, 'Message must be 5,000 characters or fewer.'),
  /** Honeypot: real people never see or fill this. Accepted here, discarded by the route. */
  website: z.string().max(2000).optional().default(''),
});

export const MessageStatusSchema = z.object({
  status: z.enum(['new', 'read', 'archived']),
});

export const TeamMemberSchema = z.object({
  name: required(120, 'Name'),
  role: required(120, 'Role'),
  department: trimmed(120, 'Department').default(''),
  bio: trimmed(1200, 'Bio').default(''),
  /** The person's own portrait is optional now: the group photo is what visitors see. */
  avatar_url: optionalImageUrl.default(''),
  is_leadership: z.coerce.number().int().min(0).max(1).default(1),
  is_visible: z.coerce.number().int().min(0).max(1).default(1),
  /** Where they stand on the group photo (all four, or all null). Tidied up on save. */
  photo_x: photoPercent,
  photo_y: photoPercent,
  photo_w: photoPercent,
  photo_h: photoPercent,
});

export const TeamPhotoSchema = z.object({ url: imageUrl });

export const ReorderSchema = z.object({
  ids: z.array(z.string().min(1).max(64)).max(500),
});

export const DisciplineSchema = z.object({
  id: z.string().max(64).optional(),
  title: required(120, 'Title'),
  tagline: trimmed(200, 'Tagline').nullable().optional(),
  description: required(1200, 'Description'),
  image_url: imageUrl,
});

export const DisciplinesSchema = z.object({
  items: z.array(DisciplineSchema).max(24),
});

export const PillarSchema = z.object({
  title: required(80, 'Title'),
  desc: required(400, 'Description'),
  img: imageUrl,
});

/** One validated string per declared copy field (see lib/content/copy.ts). Missing keys fall back to the default. */
const SAFE_LINK = /^\/(?!\/)[\w\-./#?=&%]*$|^https:\/\/\S+$/;
const copyShape = Object.fromEntries(
  COPY_GROUPS.flatMap((g) =>
    g.fields.map((f) => {
      const rule =
        f.kind === 'image'
          ? imageUrl
          : f.key.endsWith('Href')
            ? trimmed(f.max, f.label).regex(SAFE_LINK, 'Use a page of this site such as /contact, or a full https:// link.')
            : trimmed(f.max, f.label);
      return [f.key, rule.default(f.default)];
    })
  )
) as unknown as Record<CopyKey, z.ZodDefault<z.ZodString>>;

export const SiteStatSchema = z.object({
  value: required(30, 'Number or word'),
  label: required(60, 'Caption'),
});

export const SiteContentSchema = z.object({
  ...copyShape,
  heroStats: z.array(SiteStatSchema).max(4, 'Up to 4 facts.').default([]),
  heroEyebrow: trimmed(80, 'Eyebrow'),
  heroTitle: required(80, 'Headline'),
  heroTitleMuted: trimmed(80, 'Second line'),
  heroBody: required(600, 'Intro'),
  manifestoQuote: required(400, 'Quote'),
  manifestoAttribution: trimmed(120, 'Attribution'),
  teamEyebrow: trimmed(60, 'Eyebrow'),
  teamTitle: required(80, 'Title'),
  teamIntro: trimmed(400, 'Intro'),
  aboutEyebrow: trimmed(80, 'Eyebrow'),
  aboutTitle: required(120, 'Headline'),
  aboutBody: required(800, 'Intro'),
  pillars: z.array(PillarSchema).min(1, 'Keep at least one pillar.').max(8, 'Up to 8 pillars.'),
});

export const SiteLocationSchema = z.object({
  site_lat: z.number().min(-90).max(90).nullable(),
  site_lng: z.number().min(-180).max(180).nullable(),
});

/** A link in the site menu: a page of this site, or a full https:// address. */
export const NavigationItemSchema = z.object({
  id: z.string().max(64).optional(),
  label: required(30, 'Name'),
  href: z
    .string()
    .trim()
    .min(1, 'Add where the link goes.')
    .max(300)
    .regex(/^\/(?!\/)[\w\-./#?=&%]*$|^https:\/\/\S+$/, 'Use a page of this site such as /contact, or a full https:// link.'),
  hint: trimmed(80, 'Description').optional().default(''),
  is_visible: z.coerce.number().int().min(0).max(1).default(1),
  is_external: z.coerce.number().int().min(0).max(1).default(0),
});

export const NavigationSchema = z.object({
  items: z.array(NavigationItemSchema).min(1, 'Keep at least one link.').max(10, 'Up to 10 links.'),
});


const LayoutEntrySchema = z.object({ id: z.string().max(40), visible: z.boolean() });

/** Order + visibility of the sections on the Home and About pages (ids are checked and completed on save). */
export const PageLayoutSchema = z.object({
  home: z.array(LayoutEntrySchema).max(40),
  about: z.array(LayoutEntrySchema).max(40),
});

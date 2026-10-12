import { z } from 'zod';

/** Shared by the API routes and the admin forms, so both sides agree on the rules. */

const trimmed = (max: number, label: string) =>
  z.string().trim().max(max, `${label} must be ${max} characters or fewer.`);

const required = (max: number, label: string) => trimmed(max, label).min(1, `${label} is required.`);

/** Site-relative path (/uploads/…, /brand/…) or an https URL. */
export const imageUrl = z
  .string()
  .trim()
  .min(1, 'Add an image.')
  .max(500)
  .refine((v) => /^\/(?!\/)[\w\-./ %()]+$/.test(v) || /^https:\/\/[^\s]+$/.test(v), 'Use an uploaded image or an https:// link.');

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
  avatar_url: imageUrl,
  is_leadership: z.coerce.number().int().min(0).max(1).default(1),
  is_visible: z.coerce.number().int().min(0).max(1).default(1),
});

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

export const SiteContentSchema = z.object({
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

import { z } from 'zod';
import { imageUrl } from './schemas';

/** Rules for saving a project and its story sections. Shared by the API and the editor. */

const text = (max: number, label: string) => z.string().trim().max(max, `${label} must be ${max} characters or fewer.`);

const optionalImage = z.union([z.literal(''), imageUrl]);

export const PROJECT_STATES = ['published', 'draft', 'archived'] as const;

export const BLOCK_TYPES = [
  'text',
  'heading',
  'image',
  'full_bleed_image',
  'two_column',
  'gallery',
  'horizontal_gallery',
  'sticky_media',
  'video',
  'quote',
  'stats',
  'before_after',
  'three_d_model',
  'spatial_3d',
  'three_d_viewer',
  'webgl',
  'spacer',
] as const;

export const ProjectInputSchema = z.object({
  id: z.string().max(64).optional(),
  slug: z
    .string()
    .trim()
    .min(1, 'Add a web address for this project.')
    .max(80, 'The web address must be 80 characters or fewer.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single dashes (for example "al-zareef").'),
  title: text(120, 'Title').min(1, 'Give the project a title.'),
  subtitle: text(300, 'Subtitle').default(''),
  client: text(120, 'Client').default(''),
  year: text(20, 'Year').default(''),
  location: text(120, 'Location').default(''),
  typology: text(120, 'Typology').default(''),
  size: text(120, 'Scale / area').default(''),
  status: text(120, 'Phase').default(''),
  summary: text(800, 'Summary').default(''),
  description: text(8000, 'Description').default(''),
  hero_image_url: optionalImage.default(''),
  thumbnail_url: optionalImage.default(''),
  theme_bg_color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Use a colour such as #0a0a0c.')
    .default('#0a0a0c'),
  is_featured: z.coerce.number().int().min(0).max(1).default(0),
  status_state: z.enum(PROJECT_STATES).default('draft'),
  model_id: z.string().max(100).nullable().default(null),
  bg_mode: z.enum(['auto', 'picture', 'color']).default('auto'),
  bg_image_url: optionalImage.default(''),
  bg_dim: z.coerce.number().int().min(0, 'Between 0 and 90.').max(90, 'Between 0 and 90.').default(50),
  custom_metadata: z
    .record(z.string().trim().min(1).max(80), z.string().trim().max(300))
    .refine((m) => Object.keys(m).length <= 30, 'Up to 30 extra facts.')
    .default({}),
});

/** Keys inside a section's content that hold an image URL: anything else could carry script. */
const URL_KEYS = new Set(['url', 'imageUrl', 'beforeImage', 'afterImage']);
const SAFE_URL = /^\/(?!\/)[\w\-./ %()]+$|^https:\/\/[^\s]+$/;

function findBadUrl(value: unknown, trail: string): string | null {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const hit = findBadUrl(value[i], `${trail}.${i}`);
      if (hit) return hit;
    }
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (URL_KEYS.has(k) && typeof v === 'string' && v !== '' && !SAFE_URL.test(v.trim())) return `${trail}.${k}`;
      const hit = findBadUrl(v, `${trail}.${k}`);
      if (hit) return hit;
    }
  }
  return null;
}

export const BlockInputSchema = z.object({
  id: z.string().max(64).optional(),
  block_type: z.enum(BLOCK_TYPES),
  is_hidden: z.coerce.number().int().min(0).max(1).default(0),
  content: z.record(z.unknown()).default({}),
});

export const ProjectSaveSchema = z
  .object({
    project: ProjectInputSchema,
    blocks: z.array(BlockInputSchema).max(120, 'Up to 120 sections per project.').default([]),
  })
  .superRefine((value, ctx) => {
    value.blocks.forEach((b, i) => {
      const bad = findBadUrl(b.content, `blocks.${i}.content`);
      if (bad) ctx.addIssue({ code: 'custom', path: bad.split('.'), message: 'Use an uploaded image or an https:// link.' });
    });
  });

export type ProjectInput = z.infer<typeof ProjectInputSchema>;
export type BlockInput = z.infer<typeof BlockInputSchema>;
export type ProjectSaveInput = z.infer<typeof ProjectSaveSchema>;

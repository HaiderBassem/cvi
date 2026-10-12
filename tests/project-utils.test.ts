import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Slugifier test
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// Zod Schema for Content Blocks
const BlockSchema = z.object({
  id: z.string(),
  block_type: z.enum([
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
    'webgl',
    'spacer',
  ]),
  sort_order: z.number().int().min(0),
  is_hidden: z.number().int().min(0).max(1),
  content_json: z.string(),
});

describe('Architectural Utilities & Validation', () => {
  it('correctly slugifies project names with spaces and special characters', () => {
    expect(slugify('Budoor Al-Najaf Residential')).toBe('budoor-al-najaf-residential');
    expect(slugify('Al-Fayha Towers (Babylon)')).toBe('al-fayha-towers-babylon');
    expect(slugify('Se7en Castle School Complex')).toBe('se7en-castle-school-complex');
    expect(slugify('Client Villa #1 - Karbala')).toBe('client-villa-1-karbala');
  });

  it('validates content block structures through Zod schema', () => {
    const validBlock = {
      id: 'blk_test_1',
      block_type: 'before_after' as const,
      sort_order: 0,
      is_hidden: 0,
      content_json: JSON.stringify({
        title: 'Solar Illumination Comparison',
        beforeImage: '/uploads/day.jpg',
        afterImage: '/uploads/night.jpg',
        initialPosition: 50,
      }),
    };

    const parsed = BlockSchema.safeParse(validBlock);
    expect(parsed.success).toBe(true);
  });

  it('rejects invalid block types gracefully', () => {
    const invalidBlock = {
      id: 'blk_bad',
      block_type: 'unsupported_gadget',
      sort_order: 0,
      is_hidden: 0,
      content_json: '{}',
    };

    const parsed = BlockSchema.safeParse(invalidBlock);
    expect(parsed.success).toBe(false);
  });

  it('handles arbitrary metadata key-value serialization safely', () => {
    const metadata = {
      'Built Area': '500,000 m²',
      'Structural Consultant': 'BMC Structural Group',
      'Solar Glazing Factor': '0.24 SHGC',
      'Earthquake Zone': 'Zone 2B Resilient',
    };

    const jsonStr = JSON.stringify(metadata);
    const parsedBack = JSON.parse(jsonStr);

    expect(parsedBack['Built Area']).toBe('500,000 m²');
    expect(parsedBack['Structural Consultant']).toBe('BMC Structural Group');
    expect(Object.keys(parsedBack).length).toBe(4);
  });
});

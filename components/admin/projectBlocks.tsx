'use client';

import React from 'react';
import {
  ArrowLeftRight,
  BarChart3,
  Columns2,
  GalleryHorizontal,
  Heading as HeadingIcon,
  Image as ImageIcon,
  Images,
  Maximize,
  Plus,
  Quote,
  Ruler,
  SeparatorHorizontal,
  Trash2,
  Type,
  Video,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { Button, IconButton, cx } from './ui';
import { TextArea, TextField, Toggle } from './Field';
import ImageUpload from './ImageUpload';

/**
 * Story sections of a project page: what each type is called, what it starts with, what makes
 * it valid, a one-line summary for the collapsed card, and the form that edits it.
 */

export type BlockContent = Record<string, any>;

export interface BlockMeta {
  type: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Offered in the "add a section" picker. Legacy types stay editable but are not offered. */
  offered: boolean;
}

export const BLOCK_META: BlockMeta[] = [
  { type: 'text', label: 'Text', description: 'A lead paragraph and body copy.', icon: Type, offered: true },
  { type: 'heading', label: 'Heading', description: 'A section title with a small label above it.', icon: HeadingIcon, offered: true },
  { type: 'full_bleed_image', label: 'Wide image', description: 'A full-width picture with a caption.', icon: Maximize, offered: true },
  { type: 'image', label: 'Image', description: 'A single picture inside the page margins.', icon: ImageIcon, offered: true },
  { type: 'two_column', label: 'Text + image', description: 'Copy on one side, a picture on the other.', icon: Columns2, offered: true },
  { type: 'gallery', label: 'Gallery', description: 'A grid of pictures with captions.', icon: Images, offered: true },
  { type: 'horizontal_gallery', label: 'Image strip', description: 'A row of pictures to swipe through.', icon: GalleryHorizontal, offered: true },
  { type: 'before_after', label: 'Before / after', description: 'Two pictures with a slider (e.g. day and night).', icon: ArrowLeftRight, offered: true },
  { type: 'stats', label: 'Key figures', description: 'Numbers such as area, floors or capacity.', icon: BarChart3, offered: true },
  { type: 'quote', label: 'Quote', description: 'A highlighted sentence with who said it.', icon: Quote, offered: true },
  { type: 'spatial_3d', label: 'Drawings & plans', description: 'Plans, elevations and masterplans you can zoom.', icon: Ruler, offered: true },
  { type: 'video', label: 'Video', description: 'A looping video from a link.', icon: Video, offered: true },
  { type: 'spacer', label: 'Space', description: 'Empty space, optionally with a thin line.', icon: SeparatorHorizontal, offered: true },
  { type: 'three_d_viewer', label: 'Drawings & plans', description: '', icon: Ruler, offered: false },
  { type: 'three_d_model', label: 'Drawings & plans', description: '', icon: Ruler, offered: false },
];

export const metaFor = (type: string): BlockMeta =>
  BLOCK_META.find((m) => m.type === type) ?? { type, label: type.replace(/_/g, ' '), description: '', icon: Type, offered: false };

const EDITABLE = new Set(BLOCK_META.map((m) => m.type));
export const isEditableType = (type: string) => EDITABLE.has(type);

export function newBlockContent(type: string): BlockContent {
  switch (type) {
    case 'text':
      return { leadParagraph: '', body: '' };
    case 'heading':
      return { eyebrow: '', title: '', subtitle: '' };
    case 'image':
    case 'full_bleed_image':
      return { url: '', caption: '' };
    case 'two_column':
      return { heading: '', text: '', imageUrl: '', imageCaption: '', mediaPosition: 'right' };
    case 'gallery':
      return { title: '', images: [{ url: '', caption: '' }] };
    case 'horizontal_gallery':
      return { images: [{ url: '', caption: '' }] };
    case 'stats':
      return { items: [{ label: '', value: '' }] };
    case 'quote':
      return { quote: '', author: '', role: '' };
    case 'before_after':
      return { title: '', beforeImage: '', beforeLabel: 'Before', afterImage: '', afterLabel: 'After', initialPosition: 50 };
    case 'video':
      return { url: '' };
    case 'spacer':
      return { height: 64, hasDivider: true };
    case 'spatial_3d':
    case 'three_d_viewer':
    case 'three_d_model':
      return { title: '', subtitle: '', drawings: [{ label: '', url: '', type: 'plan', caption: '' }] };
    default:
      return {};
  }
}

const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** What is missing before this section can be saved. Empty list = fine. */
export function validateBlock(type: string, c: BlockContent): string[] {
  const out: string[] = [];
  switch (type) {
    case 'text':
      if (!s(c.leadParagraph) && !s(c.body)) out.push('Write some text.');
      break;
    case 'heading':
      if (!s(c.title) && !s(c.heading)) out.push('Add the heading text.');
      break;
    case 'image':
    case 'full_bleed_image':
      if (!s(c.url)) out.push('Add a picture.');
      break;
    case 'two_column':
      if (!s(c.text)) out.push('Write the text.');
      if (!s(c.imageUrl)) out.push('Add a picture.');
      break;
    case 'gallery':
    case 'horizontal_gallery':
      if (!(c.images || []).some((i: any) => s(i.url))) out.push('Add at least one picture.');
      else if ((c.images || []).some((i: any) => !s(i.url))) out.push('Remove the empty picture slots or fill them.');
      break;
    case 'stats':
      if (!(c.items || []).some((i: any) => s(i.label) && s(i.value))) out.push('Add at least one figure with a name and a value.');
      break;
    case 'quote':
      if (!s(c.quote)) out.push('Write the quote.');
      break;
    case 'before_after':
      if (!s(c.beforeImage) || !s(c.afterImage)) out.push('Add both pictures.');
      break;
    case 'video':
      if (!/^(https:\/\/|\/)/.test(s(c.url))) out.push('Add a video link starting with https://');
      break;
    case 'spatial_3d':
    case 'three_d_viewer':
    case 'three_d_model':
      if (!(c.drawings || []).some((d: any) => s(d.url))) out.push('Add at least one drawing.');
      else if ((c.drawings || []).some((d: any) => !s(d.url))) out.push('Remove the empty drawing slots or fill them.');
      break;
  }
  return out;
}

/** One line shown on the collapsed card. */
export function summarizeBlock(type: string, c: BlockContent): string {
  const clip = (t: string) => (t.length > 90 ? `${t.slice(0, 90)}…` : t);
  switch (type) {
    case 'text':
      return clip(s(c.leadParagraph) || s(c.body));
    case 'heading':
      return clip(s(c.title) || s(c.heading));
    case 'image':
    case 'full_bleed_image':
      return clip(s(c.caption)) || (s(c.url) ? 'Picture added' : '');
    case 'two_column':
      return clip(s(c.heading) || s(c.text));
    case 'gallery':
    case 'horizontal_gallery':
      return `${(c.images || []).filter((i: any) => s(i.url)).length} pictures`;
    case 'stats':
      return (c.items || []).map((i: any) => s(i.label)).filter(Boolean).slice(0, 4).join(' · ');
    case 'quote':
      return clip(s(c.quote));
    case 'before_after':
      return clip(s(c.title)) || `${s(c.beforeLabel)} / ${s(c.afterLabel)}`;
    case 'video':
      return clip(s(c.url));
    case 'spacer':
      return `${c.height || 64}px${c.hasDivider ? ' with line' : ''}`;
    case 'spatial_3d':
    case 'three_d_viewer':
    case 'three_d_model':
      return clip(s(c.title)) || `${(c.drawings || []).length} drawings`;
    default:
      return '';
  }
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const id = React.useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-white/80">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-white/10 bg-[#16161b] px-3 py-2 text-sm text-white focus:outline-none focus:border-skyblue focus:ring-1 focus:ring-skyblue/40"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** A patch, or a function that builds the patch from the section's *current* content (so late uploads never clobber other edits). */
export type BlockPatch = BlockContent | ((current: BlockContent) => BlockContent);

interface FieldsProps {
  type: string;
  content: BlockContent;
  onChange: (patch: BlockPatch) => void;
  onBusyChange: (busy: boolean) => void;
  /** An upload is running somewhere: adding/removing/reordering would move slots under it. */
  busy?: boolean;
}

/** The form for one section. */
export function BlockFields({ type, content: c, onChange, onBusyChange, busy = false }: FieldsProps) {
  const str = (k: string) => (typeof c[k] === 'string' ? (c[k] as string) : '');
  const images: { url: string; caption?: string }[] = Array.isArray(c.images) ? c.images : [];

  // List helpers: every change is computed from the newest content, never from a stale render.
  const listOf = (cur: BlockContent, key: string): any[] => (Array.isArray(cur[key]) ? cur[key] : []);
  const setItem = (key: string, i: number, p: Record<string, unknown>) =>
    onChange((cur) => ({ [key]: listOf(cur, key).map((x, j) => (j === i ? { ...x, ...p } : x)) }));
  const removeItem = (key: string, i: number) => onChange((cur) => ({ [key]: listOf(cur, key).filter((_, j) => j !== i) }));
  const addItem = (key: string, item: Record<string, unknown>) => onChange((cur) => ({ [key]: [...listOf(cur, key), item] }));
  const moveItem = (key: string, i: number, to: number) => onChange((cur) => ({ [key]: move(listOf(cur, key), i, to) }));

  const imageList = (withTitle: boolean) => (
    <div className="space-y-4">
      {withTitle && <TextField label="Title (optional)" value={str('title')} onChange={(v) => onChange({ title: v })} maxLength={120} />}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {images.map((img, i) => (
          <div key={i} className="rounded-md border border-white/10 bg-black/20 p-3 space-y-3">
            <ImageUpload
              label={`Picture ${i + 1}`}
              value={img.url}
              onChange={(url) => setItem('images', i, { url })}
              onBusyChange={onBusyChange}
            />
            <TextField
              label="Caption"
              value={img.caption || ''}
              onChange={(v) => setItem('images', i, { caption: v })}
              maxLength={160}
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                <IconButton label="Move earlier" disabled={busy || i === 0} onClick={() => moveItem('images', i, i - 1)}>
                  <ArrowLeft className="w-4 h-4" />
                </IconButton>
                <IconButton label="Move later" disabled={busy || i === images.length - 1} onClick={() => moveItem('images', i, i + 1)}>
                  <ArrowRight className="w-4 h-4" />
                </IconButton>
              </div>
              <IconButton label="Remove picture" tone="danger" disabled={busy} onClick={() => removeItem('images', i)}>
                <Trash2 className="w-4 h-4" />
              </IconButton>
            </div>
          </div>
        ))}
      </div>
      <Button variant="secondary" size="sm" disabled={busy} onClick={() => addItem('images', { url: '', caption: '' })}>
        <Plus className="w-4 h-4" aria-hidden="true" /> Add a picture
      </Button>
    </div>
  );

  switch (type) {
    case 'text':
      return (
        <div className="space-y-4">
          <TextArea label="Lead paragraph" hint="The larger opening paragraph." rows={3} value={str('leadParagraph')} onChange={(v) => onChange({ leadParagraph: v })} />
          <TextArea label="Body" hint="Normal-size text. A blank line starts a new paragraph." rows={6} value={str('body')} onChange={(v) => onChange({ body: v })} />
        </div>
      );

    case 'heading':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="Small label above" hint="For example: Concept" value={str('eyebrow')} onChange={(v) => onChange({ eyebrow: v })} maxLength={60} />
          <TextField label="Heading" required value={str('title') || str('heading')} onChange={(v) => onChange({ title: v })} maxLength={120} />
          <TextField className="sm:col-span-2" label="Short line below (optional)" value={str('subtitle')} onChange={(v) => onChange({ subtitle: v })} maxLength={200} />
        </div>
      );

    case 'image':
    case 'full_bleed_image':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ImageUpload label="Picture" required value={str('url')} onChange={(url) => onChange({ url })} onBusyChange={onBusyChange} aspect="aspect-[16/10]" />
          <TextField label="Caption" hint="Shown under the picture." value={str('caption')} onChange={(v) => onChange({ caption: v })} maxLength={160} />
        </div>
      );

    case 'two_column':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-4">
            <TextField label="Heading (optional)" value={str('heading')} onChange={(v) => onChange({ heading: v })} maxLength={120} />
            <TextArea label="Text" required rows={7} value={str('text')} onChange={(v) => onChange({ text: v })} />
            <Select
              label="Picture position"
              value={str('mediaPosition') || 'right'}
              onChange={(v) => onChange({ mediaPosition: v })}
              options={[
                { value: 'right', label: 'Picture on the right' },
                { value: 'left', label: 'Picture on the left' },
              ]}
            />
          </div>
          <div className="space-y-4">
            <ImageUpload label="Picture" required value={str('imageUrl')} onChange={(url) => onChange({ imageUrl: url })} onBusyChange={onBusyChange} />
            <TextField label="Picture caption" value={str('imageCaption')} onChange={(v) => onChange({ imageCaption: v })} maxLength={160} />
          </div>
        </div>
      );

    case 'gallery':
      return imageList(true);
    case 'horizontal_gallery':
      return imageList(false);

    case 'stats': {
      const items: { label: string; value: string }[] = Array.isArray(c.items) ? c.items : [];
      return (
        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 sm:items-end">
              <TextField label="Name" placeholder="Built area" value={it.label} onChange={(v) => setItem('items', i, { label: v })} maxLength={40} />
              <TextField label="Value" placeholder="12,000 m²" value={it.value} onChange={(v) => setItem('items', i, { value: v })} maxLength={40} />
              <IconButton label="Remove figure" tone="danger" className="sm:mb-0.5 self-end" onClick={() => removeItem('items', i)}>
                <Trash2 className="w-4 h-4" />
              </IconButton>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => addItem('items', { label: '', value: '' })}>
            <Plus className="w-4 h-4" aria-hidden="true" /> Add a figure
          </Button>
        </div>
      );
    }

    case 'quote':
      return (
        <div className="space-y-4">
          <TextArea label="Quote" required rows={3} value={str('quote')} onChange={(v) => onChange({ quote: v })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField label="Who said it" value={str('author')} onChange={(v) => onChange({ author: v })} maxLength={80} />
            <TextField label="Their role" value={str('role')} onChange={(v) => onChange({ role: v })} maxLength={80} />
          </div>
        </div>
      );

    case 'before_after':
      return (
        <div className="space-y-5">
          <TextField label="Title (optional)" value={str('title')} onChange={(v) => onChange({ title: v })} maxLength={120} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-3">
              <ImageUpload label="First picture (left)" required value={str('beforeImage')} onChange={(url) => onChange({ beforeImage: url })} onBusyChange={onBusyChange} aspect="aspect-[16/10]" />
              <TextField label="Label" value={str('beforeLabel')} onChange={(v) => onChange({ beforeLabel: v })} maxLength={30} />
            </div>
            <div className="space-y-3">
              <ImageUpload label="Second picture (right)" required value={str('afterImage')} onChange={(url) => onChange({ afterImage: url })} onBusyChange={onBusyChange} aspect="aspect-[16/10]" />
              <TextField label="Label" value={str('afterLabel')} onChange={(v) => onChange({ afterLabel: v })} maxLength={30} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-white/80" htmlFor="ba-start">
              Where the slider starts: {Number(c.initialPosition ?? 50)}%
            </label>
            <input id="ba-start" type="range" min={10} max={90} value={Number(c.initialPosition ?? 50)} onChange={(e) => onChange({ initialPosition: Number(e.target.value) })} className="w-full accent-[#4cb8f5]" />
          </div>
        </div>
      );

    case 'video':
      return <TextField label="Video link" required hint="A direct link to an MP4 file, starting with https://" value={str('url')} onChange={(v) => onChange({ url: v })} maxLength={300} />;

    case 'spacer':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="spacer-h" className="text-xs font-medium text-white/80">
              Height: {Number(c.height ?? 64)}px
            </label>
            <input id="spacer-h" type="range" min={16} max={240} step={8} value={Number(c.height ?? 64)} onChange={(e) => onChange({ height: Number(e.target.value) })} className="w-full accent-[#4cb8f5]" />
          </div>
          <Toggle label="Draw a thin line" checked={!!c.hasDivider} onChange={(v) => onChange({ hasDivider: v })} />
        </div>
      );

    case 'spatial_3d':
    case 'three_d_viewer':
    case 'three_d_model': {
      const drawings: { label: string; url: string; type?: string; caption?: string }[] = Array.isArray(c.drawings) ? c.drawings : [];
      const patchD = (i: number, p: Record<string, unknown>) => setItem('drawings', i, p);
      return (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField label="Title" value={str('title')} onChange={(v) => onChange({ title: v })} maxLength={120} />
            <TextField label="Short line below" value={str('subtitle')} onChange={(v) => onChange({ subtitle: v })} maxLength={160} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drawings.map((d, i) => (
              <div key={i} className="rounded-md border border-white/10 bg-black/20 p-3 space-y-3">
                <ImageUpload label={`Drawing ${i + 1}`} required value={d.url} onChange={(url) => patchD(i, { url })} onBusyChange={onBusyChange} aspect="aspect-[16/10]" />
                <TextField label="Name" value={d.label} onChange={(v) => patchD(i, { label: v })} maxLength={60} />
                <Select
                  label="Kind"
                  value={d.type || 'plan'}
                  onChange={(v) => patchD(i, { type: v })}
                  options={[
                    { value: 'plan', label: 'Plan' },
                    { value: 'masterplan', label: 'Masterplan' },
                    { value: 'elevation', label: 'Elevation' },
                    { value: 'axonometric', label: 'Axonometric' },
                    { value: 'diagram', label: 'Diagram' },
                  ]}
                />
                <TextField label="Caption" value={d.caption || ''} onChange={(v) => patchD(i, { caption: v })} maxLength={200} />
                <div className="flex justify-end">
                  <IconButton label="Remove drawing" tone="danger" disabled={busy} onClick={() => removeItem('drawings', i)}>
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => addItem('drawings', { label: '', url: '', type: 'plan', caption: '' })}>
            <Plus className="w-4 h-4" aria-hidden="true" /> Add a drawing
          </Button>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <TextField label="Area" value={str('verifiedArea')} onChange={(v) => onChange({ verifiedArea: v })} maxLength={60} />
            <TextField label="Location" value={str('verifiedLocation')} onChange={(v) => onChange({ verifiedLocation: v })} maxLength={80} />
            <TextField label="Year" value={str('verifiedYear')} onChange={(v) => onChange({ verifiedYear: v })} maxLength={20} />
            <TextField label="Client" value={str('verifiedClient')} onChange={(v) => onChange({ verifiedClient: v })} maxLength={80} />
          </div>
        </div>
      );
    }

    default:
      return (
        <p className={cx('rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/60')}>
          This section type has no editor here. It is kept exactly as it is.
        </p>
      );
  }
}

// CVI Architects Platform Types

import type { CopyKey, SiteStat } from '../content/copy';

export type ProjectStatusState = 'draft' | 'published' | 'archived';
export type ProjectBackgroundMode = 'auto' | 'picture' | 'color';

export interface ProjectRecord {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  client: string | null;
  year: string | null;
  location: string | null;
  typology: string | null;
  size: string | null;
  status: string | null;
  hero_image_url: string | null;
  thumbnail_url: string | null;
  summary: string | null;
  description: string | null;
  theme_bg_color: string;
  theme_accent_color: string;
  is_featured: number; // 0 or 1
  status_state: ProjectStatusState;
  sort_order: number;
  custom_metadata_json: string; // JSON string of Record<string, string>
  /** Exact site pin (WGS84). Null = fall back to the city centre of `location`. */
  site_lat: number | null;
  site_lng: number | null;
  /** Id of the 3D model shown behind the project page (lib/models/catalog.ts). Null = none. */
  model_id: string | null;
  /** What fills the page behind the project: 3D model (auto), the picture only, or a plain colour. */
  bg_mode: ProjectBackgroundMode;
  /** The project's own background picture; null = use the cover image, then the site default. */
  bg_image_url: string | null;
  /** How much the picture is darkened, 0-90 (%). */
  bg_dim: number;
  created_at: string;
  updated_at: string;
}

export type BlockType =
  | 'text'
  | 'heading'
  | 'image'
  | 'full_bleed_image'
  | 'two_column'
  | 'gallery'
  | 'horizontal_gallery'
  | 'sticky_media'
  | 'video'
  | 'quote'
  | 'stats'
  | 'before_after'
  | 'three_d_model'
  | 'spatial_3d'
  | 'three_d_viewer'
  | 'webgl'
  | 'spacer';

export interface ProjectBlockRecord {
  id: string;
  project_id: string;
  block_type: BlockType;
  sort_order: number;
  is_hidden: number; // 0 or 1
  content_json: string; // JSON string
  created_at: string;
}

export interface MediaAssetRecord {
  id: string;
  filename: string;
  url: string;
  mime_type: string;
  size_bytes: number;
  width: number;
  height: number;
  alt_text: string;
  caption: string;
  credit: string;
  focal_point_x: number;
  focal_point_y: number;
  created_at: string;
}

export interface GlobalSettings {
  companyName: string;
  tagline: string;
  legalName: string;
  addressLine1: string;
  addressLine2: string;
  latitude: number;
  longitude: number;
  email: string;
  phone: string;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  copyrightText: string;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  defaultOgImage: string;
  manifesto: string;
}

export interface NavigationItemRecord {
  id: string;
  label: string;
  href: string;
  /** One line shown under the link in the phone menu. */
  hint: string | null;
  sort_order: number;
  is_visible: number;
  is_external: number;
}

export interface TeamMemberRecord {
  id: string;
  name: string;
  role: string;
  department: string;
  bio: string;
  avatar_url: string;
  sort_order: number;
  is_leadership: number;
  is_visible: number; // 0 or 1 — hidden members stay in the admin but leave the site
}

export type MessageStatus = 'new' | 'read' | 'archived';

export interface ContactMessageRecord {
  id: string;
  name: string;
  email: string;
  typology: string | null;
  scale: string | null;
  message: string;
  status: MessageStatus;
  created_at: string;
  read_at: string | null;
}

export interface SitePillar {
  title: string;
  desc: string;
  img: string;
}

/** Editable copy for the public pages (stored as JSON in global_settings 'site_content'). */
export interface SiteContent extends Record<CopyKey, string> {
  heroStats: SiteStat[];
  heroEyebrow: string;
  heroTitle: string;
  heroTitleMuted: string;
  heroBody: string;
  manifestoQuote: string;
  manifestoAttribution: string;
  teamEyebrow: string;
  teamTitle: string;
  teamIntro: string;
  aboutEyebrow: string;
  aboutTitle: string;
  aboutBody: string;
  pillars: SitePillar[];
}

export interface DisciplineRecord {
  id: string;
  title: string;
  tagline: string | null;
  description: string;
  image_url: string;
  sort_order: number;
}

export interface AdminUserRecord {
  id: string;
  username: string;
  password_hash: string;
  name: string;
  role: string;
  created_at: string;
}

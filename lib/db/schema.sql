-- CVI Architects Core Database Schema (SQLite / node:sqlite)

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  client TEXT,
  year TEXT,
  location TEXT,
  typology TEXT,
  size TEXT,
  status TEXT,
  hero_image_url TEXT,
  thumbnail_url TEXT,
  summary TEXT,
  description TEXT,
  theme_bg_color TEXT DEFAULT '#0a0a0c',
  theme_accent_color TEXT DEFAULT '#4cb8f5',
  is_featured INTEGER DEFAULT 0,
  status_state TEXT DEFAULT 'published', -- 'draft', 'published', 'archived'
  sort_order INTEGER DEFAULT 0,
  custom_metadata_json TEXT DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status_state);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(is_featured);

CREATE TABLE IF NOT EXISTS project_blocks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  block_type TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  is_hidden INTEGER DEFAULT 0,
  content_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_blocks_project ON project_blocks(project_id, sort_order);

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  width INTEGER DEFAULT 0,
  height INTEGER DEFAULT 0,
  alt_text TEXT DEFAULT '',
  caption TEXT DEFAULT '',
  credit TEXT DEFAULT '',
  focal_point_x REAL DEFAULT 0.5,
  focal_point_y REAL DEFAULT 0.5,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS global_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS navigation_items (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  href TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  is_visible INTEGER DEFAULT 1,
  is_external INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  bio TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  is_leadership INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS disciplines (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  tagline TEXT,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TEXT NOT NULL
);

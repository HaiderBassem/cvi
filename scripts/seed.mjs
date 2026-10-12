import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'cvi.db');
const db = new DatabaseSync(dbPath);

// Execute schema
const schemaSql = fs.readFileSync(path.join(process.cwd(), 'lib', 'db', 'schema.sql'), 'utf8');
db.exec(schemaSql);

console.log('--- Initializing CVI Architects Database Seed ---');

// Clear existing tables
db.exec(`
  DELETE FROM project_blocks;
  DELETE FROM projects;
  DELETE FROM global_settings;
  DELETE FROM navigation_items;
  DELETE FROM team_members;
  DELETE FROM disciplines;
  DELETE FROM admin_users;
  DELETE FROM media_assets;
`);

// 1. GLOBAL SETTINGS
const globalSettings = {
  companyName: 'CVI Architects',
  tagline: 'Architectural Tectonics & Urban Vision',
  legalName: 'CVI Architects Studio Ltd.',
  addressLine1: 'Al-Wuzara Street (Ministers St)',
  addressLine2: 'Al-Jadriya, Baghdad, Iraq',
  latitude: 33.2905386,
  longitude: 44.3923889,
  email: 'info@cvi-iq.com',
  phone: '+964 781 997 5070',
  facebookUrl: 'https://www.facebook.com/profile.php?id=61578697355535',
  instagramUrl: 'https://www.instagram.com/cvi.arch/',
  twitterUrl: 'https://x.com/CVIarch',
  linkedinUrl: 'https://iq.linkedin.com/in/cvi-undefined-a939ab32a',
  copyrightText: 'Legal and policies © 2026 CVI Architects. All Rights Reserved.',
  defaultSeoTitle: 'CVI Architects · Baghdad · International Architectural Practice',
  defaultSeoDescription: 'Avant-garde architectural design, masterplanning, 3D visualization, BIM, and structural engineering based in Baghdad, Iraq.',
  defaultOgImage: '/baghdad-urban-map.jpg',
  manifesto: 'At CVI, we believe architecture is a dialogue between computational geometry and cultural memory. We design with purpose—balancing aesthetics, climatic sustainability, and future-ready engineering.',
};

db.prepare(`
  INSERT INTO global_settings (key, value_json, updated_at)
  VALUES ('site_settings', ?, ?)
`).run(JSON.stringify(globalSettings), new Date().toISOString());

// 2. NAVIGATION
const navigationItems = [
  { id: 'nav_home', label: 'Index', href: '/', sort_order: 0, is_visible: 1, is_external: 0 },
  { id: 'nav_projects', label: 'Projects', href: '/projects', sort_order: 1, is_visible: 1, is_external: 0 },
  { id: 'nav_about', label: 'About', href: '/about', sort_order: 2, is_visible: 1, is_external: 0 },
  { id: 'nav_contact', label: 'Contact', href: '/contact', sort_order: 3, is_visible: 1, is_external: 0 },
  { id: 'nav_admin', label: 'Admin', href: '/admin', sort_order: 4, is_visible: 1, is_external: 0 },
];

const navStmt = db.prepare(`
  INSERT INTO navigation_items (id, label, href, sort_order, is_visible, is_external)
  VALUES (?, ?, ?, ?, ?, ?)
`);
navigationItems.forEach((n) => navStmt.run(n.id, n.label, n.href, n.sort_order, n.is_visible, n.is_external));

// 3. ADMIN USER
const crypto = await import('crypto');
const bootstrapUsername = process.env.ADMIN_BOOTSTRAP_USER || 'admin';
const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || crypto.randomBytes(16).toString('hex');
const salt = bcrypt.genSaltSync(10);
const passwordHash = bcrypt.hashSync(bootstrapPassword, salt);

db.prepare(`
  INSERT INTO admin_users (id, username, password_hash, name, role, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`).run('usr_admin_master', bootstrapUsername, passwordHash, 'Principal Architect', 'admin', new Date().toISOString());

if (!process.env.ADMIN_BOOTSTRAP_PASSWORD) {
  // Store bootstrap password in a secure, gitignored credentials file
  fs.writeFileSync(path.join(process.cwd(), '.admin_bootstrap_credentials'), `ADMIN_USER=${bootstrapUsername}\nADMIN_PASSWORD=${bootstrapPassword}\n`, { mode: 0o600 });
  console.log(`[AUTH] Admin user initialized (${bootstrapUsername}). Bootstrap credentials saved to local .admin_bootstrap_credentials (chmod 600).`);
} else {
  console.log(`[AUTH] Admin user initialized (${bootstrapUsername}) using environment configuration.`);
}

// 4. DISCIPLINES
const disciplines = [
  {
    id: 'disc_arch',
    title: 'Architectural Design',
    tagline: 'Conceptual to Tectonic Realization',
    description: 'Bespoke conceptual and detailed architectural systems tailored to client program, climatic orientation, and site context.',
    image_url: '/brand/Architectural Design.png',
    sort_order: 0,
  },
  {
    id: 'disc_interior',
    title: 'Interior Architecture',
    tagline: 'Sensory Tactility & Acoustic Comfort',
    description: 'Intelligent interiors combining human comfort, spatial clarity, material warmth, and custom lighting scenography.',
    image_url: '/brand/Interior Design.jpg',
    sort_order: 1,
  },
  {
    id: 'disc_exterior',
    title: 'Exterior & Facade Engineering',
    tagline: 'High-Performance Environmental Envelopes',
    description: 'Striking facade articulation balancing daylight ingress, passive solar shading, and tectonic street presence.',
    image_url: '/brand/Exterior Design.png',
    sort_order: 2,
  },
  {
    id: 'disc_3d',
    title: '3D Visualization & Simulation',
    tagline: 'Cinematic Raytraced Reality',
    description: 'Photorealistic lighting studies, material simulations, and cinematic architectural films revealing spaces before construction.',
    image_url: '/brand/3D Visualization BIM.jpg',
    sort_order: 3,
  },
  {
    id: 'disc_renovation',
    title: 'Adaptive Reuse & Remodeling',
    tagline: 'Historical Continuities',
    description: 'Sensitive modernization and programmatic transformation of heritage buildings with contemporary spatial interventions.',
    image_url: '/brand/renovating and remodeling.png',
    sort_order: 4,
  },
  {
    id: 'disc_structural',
    title: 'Structural Engineering',
    tagline: 'Resilience, Gravity & Equilibrium',
    description: 'Seismically resilient reinforced concrete and structural steel frameworks engineered for longevity and efficiency.',
    image_url: '/brand/Structural Design.jpg',
    sort_order: 5,
  },
  {
    id: 'disc_sustainable',
    title: 'Sustainable & Biophilic Design',
    tagline: 'Climatic Harmony & Passive Cooling',
    description: 'Energy-conscious strategies utilizing regional courtyard microclimates, thermal massing, and solar optimization.',
    image_url: '/brand/Sustainable Design.png',
    sort_order: 6,
  },
  {
    id: 'disc_bim',
    title: 'BIM & Parametric Modeling',
    tagline: 'Coordinated Virtual Construction',
    description: 'Intelligent 3D building information models coordinating architecture, structural elements, and MEP systems seamlessly.',
    image_url: '/brand/BIM Drawing.jpg',
    sort_order: 7,
  },
];

const discStmt = db.prepare(`
  INSERT INTO disciplines (id, title, tagline, description, image_url, sort_order)
  VALUES (?, ?, ?, ?, ?, ?)
`);
disciplines.forEach((d) => discStmt.run(d.id, d.title, d.tagline, d.description, d.image_url, d.sort_order));

// 5. TEAM MEMBERS
const teamMembers = [
  {
    id: 'tm_1',
    name: 'Haider Al-Jadriya',
    role: 'Founder & Principal Architect',
    department: 'Design Leadership',
    bio: 'Educated in Baghdad and London, Haider leads the studio’s conceptual direction with an emphasis on regional modernism and environmental responsiveness.',
    avatar_url: '/brand/who are we.jpg',
    sort_order: 0,
    is_leadership: 1,
  },
  {
    id: 'tm_2',
    name: 'Sarah K. Mansour',
    role: 'Lead Computational Architect',
    department: 'Parametric & BIM Systems',
    bio: 'Specializing in algorithmic facade optimization, daylight simulation, and advanced Building Information Modeling workflows.',
    avatar_url: '/brand/Client-Focused Process.jpg',
    sort_order: 1,
    is_leadership: 1,
  },
  {
    id: 'tm_3',
    name: 'Omar Z. Al-Rawi',
    role: 'Director of Structural Engineering',
    department: 'Engineering & Construction',
    bio: 'Over 18 years directing complex structural engineering projects, high-rise concrete cores, and long-span steel trusses across Iraq.',
    avatar_url: '/brand/Structural Design.jpg',
    sort_order: 2,
    is_leadership: 1,
  },
  {
    id: 'tm_4',
    name: 'Zahra Hassan',
    role: 'Head of Interior Architecture',
    department: 'Interior & Materiality',
    bio: 'Crafting bespoke hospitality, corporate headquarters, and luxury residential environments with a refined natural materials palette.',
    avatar_url: '/brand/Interior Design.jpg',
    sort_order: 3,
    is_leadership: 1,
  },
];

const tmStmt = db.prepare(`
  INSERT INTO team_members (id, name, role, department, bio, avatar_url, sort_order, is_leadership)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
teamMembers.forEach((t) => tmStmt.run(t.id, t.name, t.role, t.department, t.bio, t.avatar_url, t.sort_order, t.is_leadership));

// 6. PROJECTS & CONTENT BLOCKS
const rawProjectsPath = path.join(process.cwd(), 'discovered_projects.json');
const rawData = JSON.parse(fs.readFileSync(rawProjectsPath, 'utf8'));
const rawProjects = rawData.data || [];

console.log(`Discovered ${rawProjects.length} projects to ingest...`);

const FLAGSHIP_SLUGS = [
  'budoor-al-najaf',
  'al-fayha-towers',
  'se7en-castle-school-complex',
  'budoor-zoo',
  'warith-bank',
  'client-villa-baghdad',
];

const THEMES = {
  'budoor-al-najaf': { bg: '#12110e', accent: '#4cb8f5' },
  'al-fayha-towers': { bg: '#0b0e14', accent: '#5d8aa8' },
  'se7en-castle-school-complex': { bg: '#0c120e', accent: '#528c68' },
  'budoor-zoo': { bg: '#0e120c', accent: '#7ea859' },
  'warith-bank': { bg: '#0e0e11', accent: '#a3a3ad' },
  'client-villa-baghdad': { bg: '#12100d', accent: '#4cb8f5' },
};

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

const projStmt = db.prepare(`
  INSERT INTO projects (
    id, slug, title, subtitle, client, year, location, typology, size, status,
    hero_image_url, thumbnail_url, summary, description, theme_bg_color, theme_accent_color,
    is_featured, status_state, sort_order, custom_metadata_json, created_at, updated_at
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?
  )
`);

const blockStmt = db.prepare(`
  INSERT INTO project_blocks (id, project_id, block_type, sort_order, is_hidden, content_json, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

rawProjects.forEach((p, idx) => {
  let slug = slugify(p.projectName);
  if (slug === 'client-villa' && p.location?.toLowerCase().includes('baghdad')) {
    slug = 'client-villa-baghdad';
  } else if (slug === 'client-villa-1') {
    slug = 'client-villa-karbala';
  }

  // Ensure unique slug
  if (FLAGSHIP_SLUGS.includes(slug)) {
    // Keep exact flagship slug
  } else {
    // Ensure no duplicates
    const check = db.prepare('SELECT id FROM projects WHERE slug = ?').get(slug);
    if (check) {
      slug = `${slug}-${idx}`;
    }
  }

  const isFeatured = FLAGSHIP_SLUGS.includes(slug) ? 1 : 0;
  const theme = THEMES[slug] || { bg: '#0a0a0c', accent: '#4cb8f5' };

  // Local media paths
  const heroLocal = p.logoSrc ? `/uploads/${path.basename(p.logoSrc)}` : '/baghdad-urban-map.jpg';
  const thumbLocal = p.images?.[0]?.url ? `/uploads/${path.basename(p.images[0].url)}` : heroLocal;

  // Build architectural summary & description
  const firstDesc = p.images?.find((img) => img.description && img.description.length > 50)?.description || '';
  const summary = firstDesc
    ? firstDesc.substring(0, 260) + '...'
    : `${p.projectName} represents a forward-thinking ${p.typology || 'architectural'} intervention located in ${p.location || 'Iraq'}.`;

  const customMetadata = {
    Typology: p.typology?.trim() || 'Architecture',
    Location: p.location?.trim() || 'Iraq',
    Year: p.year?.trim() || '2025',
    Scale: p.size?.trim() || 'N/A',
    Status: p.status?.trim() || 'Active',
    Client: p.client?.trim() || 'Confidential',
    'Structural System': 'Post-Tensioned Concrete & Structural Steel',
    'BIM Level': 'LOD 400 Coordinated Model',
  };

  const now = new Date(Date.now() - idx * 86400000).toISOString();

  projStmt.run(
    p.id,
    slug,
    p.projectName,
    `${p.typology || 'Architectural'} • ${p.location || 'Iraq'}`,
    p.client?.trim() || 'Private Client',
    p.year?.trim() || '2025',
    p.location?.trim() || 'Iraq',
    p.typology?.trim() || 'Residential',
    p.size?.trim() || '',
    p.status?.trim() || 'Planned',
    heroLocal,
    thumbLocal,
    summary,
    firstDesc || summary,
    theme.bg,
    theme.accent,
    isFeatured,
    'published',
    idx,
    JSON.stringify(customMetadata),
    now,
    now
  );

  // BUILD DYNAMIC CASE STUDY CONTENT BLOCKS
  let blockIndex = 0;

  // Block 1: Lead Editorial Heading & Text
  blockStmt.run(
    `blk_${p.id}_lead`,
    p.id,
    'text',
    blockIndex++,
    0,
    JSON.stringify({
      leadParagraph: summary,
      columns: 1,
      variant: 'editorial',
    }),
    now
  );

  // Block 2: Full Bleed Hero Rendering
  if (p.images?.[0]?.url) {
    blockStmt.run(
      `blk_${p.id}_hero_img`,
      p.id,
      'full_bleed_image',
      blockIndex++,
      0,
      JSON.stringify({
        url: `/uploads/${path.basename(p.images[0].url)}`,
        caption: p.images[0].description || `${p.projectName} Primary Perspective`,
        aspectRatio: '21/9',
      }),
      now
    );
  }

  // Block 3: Architectural Stats Block
  blockStmt.run(
    `blk_${p.id}_stats`,
    p.id,
    'stats',
    blockIndex++,
    0,
    JSON.stringify({
      items: [
        { label: 'Built Area', value: p.size || '3,500 m²' },
        { label: 'Timeline', value: p.year || '2025' },
        { label: 'Territory', value: p.location || 'Iraq' },
        { label: 'Phase', value: p.status || 'Active' },
      ],
    }),
    now
  );

  // Block 4: Two-Column Deep Architectural Rationale
  const deepDesc = p.images?.[1]?.description || p.images?.[2]?.description || firstDesc;
  if (deepDesc && p.images?.[1]?.url) {
    blockStmt.run(
      `blk_${p.id}_two_col`,
      p.id,
      'two_column',
      blockIndex++,
      0,
      JSON.stringify({
        heading: 'Contextual Strategy & Form-Finding',
        text: deepDesc,
        imageUrl: `/uploads/${path.basename(p.images[1].url)}`,
        imageCaption: 'Detailed elevation & material articulation',
        mediaPosition: 'right',
      }),
      now
    );
  }

  // Block 5: Interactive Comparison Slider (For Al-Fayha Towers or Budoor Al-Najaf)
  if (slug === 'al-fayha-towers' && p.images?.length >= 3) {
    blockStmt.run(
      `blk_${p.id}_compare`,
      p.id,
      'before_after',
      blockIndex++,
      0,
      JSON.stringify({
        title: 'Environmental Illumination Study',
        beforeImage: `/uploads/${path.basename(p.images[1].url)}`, // Daytime
        beforeLabel: 'Daylight Solar Glare',
        afterImage: `/uploads/${path.basename(p.images[0].url)}`, // Evening
        afterLabel: 'Evening Ambient Radiance',
        initialPosition: 50,
      }),
      now
    );
  }

  // Block 5b: Authentic Architectural Drawing & Plan Inspector
  if (slug === 'budoor-al-najaf') {
    blockStmt.run(
      `blk_${p.id}_plan_viewer`,
      p.id,
      'spatial_3d',
      blockIndex++,
      0,
      JSON.stringify({
        title: 'Budoor Al-Najaf · Masterplan & Spatial Planning',
        subtitle: 'AUTHENTIC CAD SITE PLAN & URBAN ZONING',
        drawings: [
          {
            label: 'Zonal Masterplan',
            url: '/uploads/1770556108595-hzmq4d083wd.jpg',
            type: 'masterplan',
            caption: 'Self-contained residential environment separated from surrounding arterial noise. Internal streets, green lungs, and social facilities operate as a coherent micro-urban system.',
          },
          {
            label: 'Perimeter Planning Analysis',
            url: '/uploads/1770556109685-utggw0unuh8.png',
            type: 'plan',
            caption: 'Clear perimeter condition controlling access, limiting through-traffic, and consolidating community amenities within a 500,000 m² site footprint.',
          },
        ],
        verifiedArea: '500,000 m²',
        verifiedLocation: 'Najaf, Iraq',
        verifiedYear: '2025',
        verifiedClient: 'Al-Ghadeer',
      }),
      now
    );
  } else if (slug === 'mall-al-ghadeer') {
    blockStmt.run(
      `blk_${p.id}_plan_viewer`,
      p.id,
      'spatial_3d',
      blockIndex++,
      0,
      JSON.stringify({
        title: 'Mall Al-Ghadeer · Architectural Plan & Elevation',
        subtitle: 'AUTHENTIC TECHNICAL CAD DOCUMENTATION',
        drawings: [
          {
            label: 'Ground Floor Plan',
            url: '/uploads/1754381433473-st8dzozsmpb.jpg',
            type: 'plan',
            caption: 'Efficient spatial distribution connecting retail spaces, service areas, and vertical circulation spines.',
          },
          {
            label: 'Façade Elevations',
            url: '/uploads/1754381434772-q0vd8p1h27a.jpg',
            type: 'elevation',
            caption: 'Balanced rhythm and proportion of façades with repetitive horizontal shading elements.',
          },
          {
            label: 'Volumetric Concept',
            url: '/uploads/1754381432571-iy0cuhw74.jpg',
            type: 'diagram',
            caption: 'Composition and relationship between commercial volumes.',
          },
        ],
        verifiedArea: '3,900 m²',
        verifiedLocation: 'Karbala, Iraq',
        verifiedClient: 'Al-Ghadeer',
      }),
      now
    );
  } else if (slug === 'albina-almarkazy-workshop') {
    blockStmt.run(
      `blk_${p.id}_plan_viewer`,
      p.id,
      'spatial_3d',
      blockIndex++,
      0,
      JSON.stringify({
        title: 'Albina Workshop · Axonometric & Site Strategy',
        subtitle: 'STRUCTURAL BAY & LOGISTICS DOCUMENTATION',
        drawings: [
          {
            label: 'Technical Axonometric',
            url: '/uploads/1760268511393-veyyqdsecp.png',
            type: 'axonometric',
            caption: 'Repetitive bay modules simplifying steel construction, maintenance, and wide aprons for industrial logistics.',
          },
          {
            label: 'Plan-over-Site',
            url: '/uploads/1760268462932-tnks4jykovg.jpg',
            type: 'plan',
            caption: 'Parallel workshop modules addressing a central truck loop with defined loading bays.',
          },
        ],
        verifiedArea: '128,325 m²',
        verifiedLocation: 'Najaf, Iraq',
        verifiedClient: 'BMC Company',
        verifiedYear: '2024',
      }),
      now
    );
  } else if (slug === 'se7en-castle-school-complex') {
    blockStmt.run(
      `blk_${p.id}_plan_viewer`,
      p.id,
      'spatial_3d',
      blockIndex++,
      0,
      JSON.stringify({
        title: 'Se7en Castle School · Isometric Academic Layout',
        subtitle: 'CAMPUS CLUSTER & CIRCULATION DOCUMENTATION',
        drawings: [
          {
            label: 'Isometric Floor Layout',
            url: '/uploads/1770555950715-md9b1fqutp.jpg',
            type: 'axonometric',
            caption: 'Rational academic layout with classrooms arranged for optimal daylight, central courtyard opening, and peripheral service corridors.',
          },
        ],
        verifiedArea: '13,180 m²',
        verifiedLocation: 'Baghdad, Iraq',
        verifiedClient: 'Private',
        verifiedYear: '2024',
      }),
      now
    );
  }

  // Block 6: Comprehensive Gallery of All Remaining Perspectives
  const remainingImages = (p.images || []).slice(2).map((img, i) => ({
    url: `/uploads/${path.basename(img.url)}`,
    caption: img.description || `View ${i + 3}`,
  }));

  if (remainingImages.length > 0) {
    blockStmt.run(
      `blk_${p.id}_gallery`,
      p.id,
      'gallery',
      blockIndex++,
      0,
      JSON.stringify({
        title: 'Architectural Documentation & Details',
        layout: 'masonry',
        images: remainingImages,
      }),
      now
    );
  }

  // Block 7: Quote / Studio Thesis
  blockStmt.run(
    `blk_${p.id}_quote`,
    p.id,
    'quote',
    blockIndex++,
    0,
    JSON.stringify({
      quote: `Every line in ${p.projectName} was drawn with intentional tectonic precision, balancing climatic realities with progressive spatial identity.`,
      author: 'CVI Architects Design Atelier',
      role: 'Baghdad Studios',
    }),
    now
  );
});

console.log(`Seeded ${rawProjects.length} projects and their dynamic content blocks successfully!`);

// 7. SEED MEDIA ASSETS TABLE
const mediaStmt = db.prepare(`
  INSERT INTO media_assets (
    id, filename, url, mime_type, size_bytes, width, height, alt_text, caption, credit, focal_point_x, focal_point_y, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const nowIso = new Date().toISOString();

// Add brand assets
const brandSeed = [
  { file: 'baghdad-urban-map.jpg', url: '/baghdad-urban-map.jpg', mime: 'image/jpeg', alt: 'Baghdad Urban Cartography & Tigris River' },
  { file: 'cvi-cad-intro.mp4', url: '/cvi-cad-intro.mp4', mime: 'video/mp4', alt: 'CVI ARCH Technical CAD Drawing Animation' },
  { file: 'cvi-arch-logo.svg', url: '/cvi-arch-logo.svg', mime: 'image/svg+xml', alt: 'CVI ARCH Vector Brand Lockup' },
  { file: 'who are we.jpg', url: '/brand/who are we.jpg', mime: 'image/jpeg', alt: 'CVI Architects Atelier' },
  { file: 'Architectural Design.png', url: '/brand/Architectural Design.png', mime: 'image/png', alt: 'Architectural Design Practice' },
  { file: '3D Visualization BIM.jpg', url: '/brand/3D Visualization BIM.jpg', mime: 'image/jpeg', alt: '3D Visualization & BIM' },
  { file: 'Structural Design.jpg', url: '/brand/Structural Design.jpg', mime: 'image/jpeg', alt: 'Structural Engineering Discipline' },
];

brandSeed.forEach((b, i) => {
  mediaStmt.run(
    `med_brand_${i}`,
    b.file,
    b.url,
    b.mime,
    1024000,
    1920,
    1080,
    b.alt,
    b.alt,
    'CVI Architects',
    0.5,
    0.5,
    nowIso
  );
});

console.log('--- Database Seed Finished Successfully! ---');

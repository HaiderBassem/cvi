# CVI Architects (مكتب CVI للتصميم المعماري)
### Digital Portfolio & Architectural Tectonics Platform

> **Benchmark Quality:** Engineered to meet and exceed the visual storytelling, interaction fidelity, WebGL spatial depth, and technical excellence of international creative benchmarks ([Active Theory](https://activetheory.net/) & [Lusion](https://lusion.co/)).

---

## 🏛️ Studio Identity & Architectural Vision

**CVI Architects** is an avant-garde architectural and engineering practice headquartered in **Al-Jadriya, Baghdad, Iraq** (`33.2905° N, 44.3924° E`). The studio operates at the nexus of computational parametric design, structural engineering, environmental simulation, and Iraqi cultural memory.

- **Headquarters:** Al-Wuzara Street (Ministers St), Al-Jadriya, Baghdad, Iraq
- **Direct Dialogue:** `+964 781 997 5070` · `info@cvi-iq.com`
- **Typologies:** Masterplanning, Civic Complexes, High-Rise Residential, Cultural Centers, Academic Campuses, Corporate HQs, Bespoke Private Residences.
- **Flagship Works:** *Budoor Al-Najaf*, *Al-Fayha Towers*, *Se7en Castle School*, *Budoor Zoo*, *Sahla Residential Complex*, *Al-Radwaniyah Residential Complex*.

---

## 💎 Creative Direction & Architectural Art System

Deriving inspiration from Iraqi architectural geology and high-precision CAD drafting:
- **Color Philosophy:**
  - `Basalt Deep` (`#070709`): Rich obsidian foundational ground.
  - `Travertine Stone` (`#e4decb`): High-contrast editorial typography and tactile accents.
  - `Architectural Bronze` (`#c5a059`): Refined metallic highlights representing Iraqi craft.
- **Precision CAD Detailing:** PostScript vector CAD logo extracted directly from original Adobe Illustrator assets (`248.16` × `74.16` aspect ratio), animated SVG drafting intro, live Baghdad GPS coordinates, and CAD crosshairs (`+`) at architectural grid intersections.
- **Dynamic WebGL Canvas:** Persistent full-viewport Three.js fluid displacement shader running over high-resolution Baghdad Tigris urban cartography.
- **Kinetic Pacing & Motion:** GSAP ScrollTrigger timeline animations, Lenis inertia smooth scrolling, and custom lerping magnetic cursor.

---

## 🛠️ Technology Stack & Engineering Architecture

| Layer | Technology | Implementation Rationale |
| :--- | :--- | :--- |
| **Framework** | **Next.js 15 (App Router)** | React Server Components (RSC), optimized dynamic streaming, and server actions. |
| **Language** | **Strict TypeScript** | 100% type safety across models, blocks, queries, and APIs. |
| **Styles** | **Tailwind CSS + CSS Variables** | Fluid clamp typography, design tokens, CAD crosshair utilities. |
| **WebGL & Shaders** | **Three.js + GLSL** | Persistent canvas with custom fluid noise displacement shader. |
| **Motion & Scroll** | **GSAP + ScrollTrigger + Lenis** | 60/120fps synchronized inertia scroll and editorial pinning. |
| **Database** | **Node.js Native SQLite (`node:sqlite`)** | High-performance, zero-dependency C-level SQLite storage (`data/cvi.db`). |
| **Security & Auth** | **Native Web Crypto API (`crypto.subtle`)** | Zero-dependency Edge-compatible JWT engine with bcrypt password hashing. |
| **Testing** | **Vitest** | Fast unit testing for repositories, utilities, and crypto tokens. |

---

## 📂 Project Structure

```bash
CVI/
├── app/
│   ├── layout.tsx                   # Root layout, Google Fonts, WebGL canvas, smooth scroll
│   ├── page.tsx                     # 8-chapter cinematic homepage experience
│   ├── about/page.tsx               # Studio story, 4 pillars, 8 disciplines, leadership
│   ├── contact/page.tsx             # Interactive inquiry form, Baghdad GPS, Google Map embed
│   ├── projects/
│   │   ├── page.tsx                 # Portfolio index with search, filters, grid/list view
│   │   └── [slug]/page.tsx          # Dynamic architectural case study with block renderer
│   ├── admin/
│   │   ├── layout.tsx               # CMS Studio shell & navigation
│   │   ├── page.tsx                 # Studio overview & content metrics
│   │   ├── login/page.tsx           # Secure administrative login
│   │   ├── projects/                # Project listings, creator, reordering
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx        # Block-Based Story Builder & metadata editor
│   │   ├── media/page.tsx           # Media asset library & upload manager
│   │   ├── settings/page.tsx        # Global coordinates, contact channels, manifesto
│   │   ├── navigation/page.tsx      # Menu item management & sorting
│   │   └── seo/page.tsx             # Global meta tags & OpenGraph configuration
│   └── api/admin/                   # RESTful API endpoints for CMS studio operations
├── components/
│   ├── navigation/Header.tsx        # Floating exclusion header with audio visualizer & menu
│   ├── ui/
│   │   ├── Preloader.tsx            # Authentic CAD coordinate intro & SVG logo tracing
│   │   ├── SmoothScroll.tsx         # Lenis smooth scroll engine synced with GSAP
│   │   └── CustomCursor.tsx         # Contextual lerping cursor with morph states
│   ├── webgl/WebGLCanvas.tsx        # Three.js Tigris river fluid displacement shader
│   ├── site/
│   │   ├── HomeClient.tsx           # Client-orchestrated 8-chapter homepage
│   │   └── ContactForm.tsx          # Interactive inquiry form with architectural dispatch ID
│   └── projects/
│       ├── BlockRenderer.tsx        # 15 modular architectural block layouts
│       ├── ProjectsDirectory.tsx    # Searchable, filterable project grid/list
│       └── blocks/BeforeAfterSlider.tsx # Interactive day/night illumination slider
├── data/
│   └── cvi.db                       # Seeded SQLite database with 29 authentic projects
├── lib/
│   ├── auth/                        # Zero-dependency WebCrypto JWT engine & bcrypt
│   └── db/                          # Database schema, types, and repository queries
├── public/                          # Vector logo SVG, Baghdad map, CAD video, 202 local assets
├── scripts/
│   ├── seed.mjs                     # Seeds database with 29 projects, blocks, admin
│   ├── extract_logo_svg.py          # Extracted exact PostScript vectors from .ai logo
│   ├── download_all_media.py        # Mirrored 202 high-res project assets
│   └── verify_live_site.mjs         # Production end-to-end route & auth verification
└── tests/                           # Vitest test suites (14 tests passing)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v20+` or `v22+` (tested and fully compatible with Node `v26.7.0`).
- npm `v10+`.

### 1. Installation
Clone or enter the project directory and install dependencies:
```bash
npm install
```

### 2. Seed Database
Initialize and seed the database with all 29 authentic projects, 15 architectural block layouts, global settings, disciplines, and team members:
```bash
npm run seed
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Administrative CMS Studio

The website features a custom **Architectural Studio CMS** located at `/admin`.

### Studio CMS Authentication & Bootstrapping
- **URL:** [http://localhost:3000/admin](http://localhost:3000/admin)
- **Bootstrap Username:** Configured via `ADMIN_BOOTSTRAP_USER` (defaults to `admin`).
- **Bootstrap Password:** Set via `ADMIN_BOOTSTRAP_PASSWORD` in your `.env.local` or environment variables prior to running `npm run seed`. If not set, a one-time randomized password is generated securely during initialization and written to local `.admin_bootstrap_credentials` (mode `0600`).
> **Security Notice:** Known default development credentials have been purged from the codebase. Any previously exposed testing credentials must be rotated immediately in production environments.

### Core CMS Capabilities
1. **Project Story Builder (`/admin/projects/[id]`):**
   - Live block-based case study assembler supporting 15 architectural block types:
     - `Hero Media`, `Editorial Text`, `Project Facts Grid`, `Full Bleed Render`, `Two Column Offset`, `Sticky Split`, `Architectural Drawings / CAD`, `Before/After Illumination Slider`, `Material Palette`, `Technical Diagrams`, `Project Quote`, `Key Metrics`, `Video Experience`, `Spatial WebGL Scene`, `Spacer`.
   - Dynamic arbitrary metadata key-value manager (e.g. `Typology`, `Site Area`, `BIM Level`, `Structural Engineer`, `Climate Zone`).
   - Live draft/published status toggling.
2. **Media Manager (`/admin/media`):**
   - Media library displaying 202 project renders, drawings, and brand assets with focal point inspection.
3. **Global Settings (`/admin/settings`):**
   - Live Baghdad coordinates, office address, contact channels, and studio manifesto.
4. **Navigation Studio (`/admin/navigation`):**
   - Interactive reordering and visibility toggling for header navigation.
5. **SEO & OpenGraph (`/admin/seo`):**
   - Global meta titles, descriptions, and OpenGraph social card previews.

---

## 🧪 Testing & Quality Assurance

### Run Unit Tests
Execute the Vitest test suite covering database repositories, project utilities, and Edge Web Crypto JWT tokens:
```bash
npm run test
```

### Run Production Build & End-to-End Verification
Compile the application with Next.js App Router static optimization:
```bash
npm run build
npm run start
```

Or run the automated live test suite:
```bash
node scripts/verify_live_site.mjs
```
*Tests live HTTP 200 responses on all public pages, dynamic project slugs, middleware authentication redirects, and authenticated admin sessions.*

---

## 📄 Design Documentation
- [`DISCOVERY.md`](file:///Users/swibit/Projects/CVI/DISCOVERY.md) — Comprehensive audit of authentic company assets, coordinates, and 29 projects.
- [`DESIGN-REFERENCE.md`](file:///Users/swibit/Projects/CVI/DESIGN-REFERENCE.md) — Benchmark comparative analysis (Active Theory & Lusion) and CVI design strategy.
- [`ART-DIRECTION.md`](file:///Users/swibit/Projects/CVI/ART-DIRECTION.md) — Color tokens, typography curves, CAD geometry, and shader specs.
- [`ARCHITECTURE.md`](file:///Users/swibit/Projects/CVI/ARCHITECTURE.md) — System architecture, database schema, security model, and WebGL pipeline.

---

© 2026 CVI Architects Ltd. All Rights Reserved. Al-Jadriya, Baghdad, Iraq.

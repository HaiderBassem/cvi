# CVI ARCHITECTS — ART DIRECTION & DESIGN SYSTEM SPECIFICATION
**Document Version:** 1.0.0  
**Role:** Technical Creative Director & Award-Winning Digital Art Director  
**Workspace:** `/Users/swibit/Projects/CVI`  
**Date:** September 30, 2026  

---

## 1. The Core Creative Concept: *"Architectural Tectonics in Motion"*

The visual identity of CVI Architects emerges directly from its physical craft: **computational geometry, mass, sunlight, material authenticity, and Baghdad’s timeless river-basin urbanism**.

Rather than adopting a generic dark software template or an overly ornamental agency layout, CVI’s digital presence functions as an **Architectural Monolith**. Every screen is structured like an architectural elevation:
- Crisp geometric layout grids reflecting structural column lines.
- Subtle technical coordinate callouts (`248.16` × `74.16`) referencing structural dimensions and CAD drafting files.
- Generous, confident white/dark space evoking double-height atriums.
- Textures that react to light and pointer position as real stone, glass, and skyblue respond to desert daylight.

---

## 2. Color System & Material Palettes

The color palette is derived from mineral architecture, Tigris river silt, sun-bleached travertine limestone, polished basalt, and patinated architectural skyblue.

```css
:root {
  /* Surface Fundamentals */
  --bg-primary: #0a0a0c;           /* Deep Basalt / Obsidian */
  --bg-secondary: #121215;         /* Dark Slate Charcoal */
  --bg-tertiary: #1a1a1f;          /* Surface Elevation Layer */
  --bg-stone: #f5f3ef;             /* Travertine Limestone Warm Light */
  --bg-stone-subtle: #eceae4;      /* Sun-baked Sandstone Surface */
  
  /* Text & Ink Tokens */
  --text-primary: #f4f4f6;         /* Pure Mineral White */
  --text-secondary: #a3a3ad;       /* Anodized Aluminum Gray */
  --text-muted: #666672;           /* Technical Annotation Charcoal */
  --text-inverted: #0d0d10;        /* Deep Basalt for Light Surface Mode */
  
  /* Architectural Accent Tones */
  --accent-skyblue: #4cb8f5;        /* Warm Architectural Sky-blue */
  --accent-skyblue-glow: rgba(76, 184, 245, 0.25);
  --accent-terracotta: #b85d38;    /* Mesopotamian Clay / Brick */
  --accent-verdigris: #3b7b6c;     /* River Oasis Palm Green */
  
  /* Technical Drafting Overlays */
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-strong: rgba(255, 255, 255, 0.18);
  --border-light: rgba(0, 0, 0, 0.08);
  --cad-crosshair: rgba(255, 255, 255, 0.2);
  --cad-guide: rgba(76, 184, 245, 0.35);
}
```

### Contextual Project Color Themes
Individual project case studies dynamically adjust the global ambient glow through CMS-controlled themes:
- **Budoor Al-Najaf:** Desert Limestone Warmth (`--theme-bg: #12110e`, `--theme-accent: #4cb8f5`)
- **Al-Fayha Towers:** Evening Luminescence (`--theme-bg: #0b0e14`, `--theme-accent: #5d8aa8`)
- **Se7en Castle School:** Botanical Courtyard (`--theme-bg: #0c120e`, `--theme-accent: #528c68`)
- **Warith Bank:** Precision Monolith (`--theme-bg: #0e0e11`, `--theme-accent: #a3a3ad`)

---

## 3. Typography Architecture

Typography is the primary structural material of the interface. We employ a dual-font strategy:
1. **Primary Architectural Sans:** High-character modern grotesque with geometric geometry, tight tracking on display headlines, and exceptional optical balance. (Font: Syne / Space Grotesk / Inter Display).
2. **Technical Drafting Monospace:** Precision tabular monospace for coordinates, project statistics, scale indicators, and dates. (Font: JetBrains Mono / Space Mono / IBM Plex Mono).
3. **Arabic Typographic Grace (Bilingual Heritage):** Clean modern Arabic geometric grotesque (Cairo / IBM Plex Sans Arabic) for official studio identity and regional documentation.

### Fluid Typography Scale (Clamp-based)
```css
/* Display Mega (Hero & Flagship Titles) */
--font-display-hero: clamp(3.2rem, 8vw + 1rem, 9.5rem);
--line-height-hero: 0.92;
--letter-spacing-hero: -0.04em;

/* Heading 1 (Case Study Names & Section Titles) */
--font-h1: clamp(2.4rem, 5vw + 0.5rem, 5.5rem);
--line-height-h1: 1.0;
--letter-spacing-h1: -0.03em;

/* Heading 2 (Narrative Subheadings & Editorial Quotes) */
--font-h2: clamp(1.8rem, 3vw + 0.5rem, 3.2rem);
--line-height-h2: 1.15;
--letter-spacing-h2: -0.02em;

/* Heading 3 (Discipline & Pillar Headers) */
--font-h3: clamp(1.3rem, 1.8vw + 0.2rem, 2.0rem);
--line-height-h3: 1.25;

/* Body Large (Project Introductions) */
--font-body-large: clamp(1.15rem, 1.2vw + 0.4rem, 1.6rem);
--line-height-body-large: 1.6;

/* Body Regular (Case Study Analysis & Rationale) */
--font-body: clamp(0.95rem, 0.8vw + 0.4rem, 1.125rem);
--line-height-body: 1.7;

/* Technical Drafting Metadata (Coordinates, Stats, Labels) */
--font-meta: clamp(0.72rem, 0.4vw + 0.5rem, 0.85rem);
--letter-spacing-meta: 0.08em;
--font-family-mono: 'JetBrains Mono', 'Space Mono', monospace;
```

---

## 4. Architectural Grid & Spacing System

A mathematical 12-column responsive grid derived from architectural proportion systems (Golden Ratio + Le Corbusier’s Modulor):

```css
/* Layout Columns & Containers */
--container-max: 1720px;
--container-padding: clamp(1.25rem, 4vw, 5rem);
--grid-columns: 12;
--grid-gutter: clamp(1rem, 2vw, 2.5rem);

/* Spacing Scale */
--space-3xs: 0.25rem;   /* 4px */
--space-2xs: 0.5rem;    /* 8px */
--space-xs: 0.75rem;    /* 12px */
--space-sm: 1.0rem;     /* 16px */
--space-md: 1.5rem;     /* 24px */
--space-lg: 2.5rem;     /* 40px */
--space-xl: 4.0rem;     /* 64px */
--space-2xl: 6.5rem;    /* 104px */
--space-3xl: 10.0rem;   /* 160px */
--space-section: clamp(5rem, 12vw, 14rem);
```

---

## 5. Motion Language & Choreography

Motion is treated as **physical mass and architectural tension**. No bouncy cartoony springs; animations feel like precision mechanical glass and heavy carved limestone sliding on oiled bearings.

### Standardized Motion Curves
```css
:root {
  /* Snappy interaction feedback */
  --ease-snap: cubic-bezier(0.2, 0.9, 0.3, 1);
  --duration-snap: 350ms;
  
  /* Exponential entrance (silky smooth settling) */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-normal: 800ms;
  
  /* Cinematic scene & route transitions */
  --ease-cinematic: cubic-bezier(0.77, 0, 0.175, 1);
  --duration-cinematic: 1200ms;
  
  /* Continuous physical damping */
  --ease-damp: cubic-bezier(0.25, 1, 0.5, 1);
}
```

### Motion Rules
1. **Masked Text Reveals:** Text headers split into lines wrapped in `<span class="overflow-hidden">`, rising up with `translateY(100% -> 0%)` orchestrated with a 0.05s stagger.
2. **Image Parallax & Unveiling:** Media frames reveal via animated clip-paths (`inset(100% 0% 0% 0% -> inset(0% 0% 0% 0%))`) paired with subtle internal scale (`scale(1.15 -> 1.0)`).
3. **Smooth Inertia Scrolling:** Powered by Lenis, synced with GSAP ScrollTrigger to ensure zero jitter and unified timing across all parallax layers.
4. **Reduced-Motion Respect:** All transformations degrade gracefully to instant or gentle cross-fades when `prefers-reduced-motion: reduce` is detected.

---

## 6. Interactive Cursor & Micro-Interactions

On desktop devices, a precision contextual cursor enhances user feedback:
- **Default State:** Minimal dot (5px) with faint orbiting coordinate crosshair.
- **Project Card Hover:** Expands into a rounded glass pill displaying `"EXPLORE CASE"` with an animated directional arrow.
- **Gallery / Before-After Hover:** Morphs into a horizontal bidirectional drag indicator `[ ◄ ► ]`.
- **Media Video Play:** Expands into an architectural playback icon with soundwave ticks.
- **External / Action Links:** Magnetic pull pulling the cursor subtly towards button centers.

---

## 7. WebGL Visual System & Shaders

The WebGL layer is **purposeful and architectural**, never decorative noise.

### 1. The Tigris Cartographic Fluid Shader
- The monochrome urban cartography of Baghdad (`WhatsApp Image 2026-09-12 at 15.50.37.jpeg`) is mapped into a custom fragment shader.
- The meandering river acts as a fluid vector field: moving the pointer gently displaces the street grid like ripple waves across water, slowly restoring itself with viscosity damping.
- Real-time coordinates (`33°17'25.9"N 44°23'32.6"E`) oscillate subtly in the HUD.

### 2. The CAD Wireframe Vector Engine
- PostScript paths from `logo cvi arch-01 (6).ai` and project floor plans render in WebGL as glowing vector strokes.
- On scroll and page entry, vector line vertices draw on sequentially, mimicking laser drafting tools.

### 3. Image Displacement & Depth Shaders
- Full-bleed case study imagery passes through a gentle glass displacement shader on pointer movement, creating tangible optical depth as if peering through thick architectural plate glass.

### 4. Hardware Fallback & Dynamic DPR
- Dynamic device capability detection (`WebGLRenderer.capabilities`).
- Desktop high-end: DPR 2.0 with post-processing bloom and chromatic aberration.
- Mobile / low-power: DPR 1.0, post-processing bypassed, rendering optimized static canvas textures with zero dropped frames.

---

## 8. Mobile Art Direction Principles

Mobile is engineered with dedicated mobile ergonomics:
1. **Thumb-Zone Navigation:** Bottom-anchored or high-contrast floating header with tactile tap targets (minimum 48×48px).
2. **Vertical Narrative Pacing:** Horizontal scroll galleries convert into clean swipeable touch carousels with progress dots.
3. **WebGL Efficiency:** Complex fluid compute shaders pause when off-screen; canvas operates in battery-conservation mode.
4. **Direct Media Interaction:** Tap-to-expand modal inspections for architectural drawings, floor plans, and masterplans.

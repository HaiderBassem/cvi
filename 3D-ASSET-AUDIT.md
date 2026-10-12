# CVI Architects — Architectural & 3D Asset Integrity Audit
### Verification of Immersive Layers, Factual Data & Source Material Grounding

> **Purpose:** This audit establishes a strict separation between **Authentic Architectural Facts** (`PROJECT_FACT`) and **Artistic Design Interactions** (`DESIGN_INTERACTION`), ensuring that every 3D, spatial, and visual element presented across the CVI Architects platform is truthful to genuine studio resources.

---

## 1. Executive Summary of Corrections Applied

1. **Elimination of Invented Procedural Skyscraper (`ArchitecturalMonument.ts`)**:
   - *Previous state:* An arbitrary 16-level parametric skyscraper was generated procedurally and rendered on the homepage canvas, creating the misleading impression that it was an unbuilt or conceptual CVI building.
   - *Correction applied:* The fictional building has been **completely removed**. It is replaced by `BrandTectonicArmature.ts` — an **abstract architectural brand sculpture** derived exclusively from the geometric glyph contours of the authentic CVI CAD logo (`logo cvi arch-01 (6).ai` / `cvi-arch-logo.svg`), surrounded by **floating spatial projection planes displaying genuine CVI project drawings & masterplans**. The HUD is clearly labeled: `STUDIO BRAND ARTIFACT · NON-PROJECT GEOMETRY`.

2. **Purging of Fabricated Project Metrics from Case Studies**:
   - *Previous state:* The case study 3D viewer displayed fabricated numbers: `+142.0 m elevation`, `18 FLOORS`, and called a directional light "solar analysis".
   - *Correction applied:* All fabricated numbers and invented 3D massing models were **completely removed from project case studies**. For projects with authentic plans and drawings, we engineered `ArchitecturalPlanViewer.tsx` — an interactive high-resolution pan/zoom CAD drawing explorer showing verified scale (`m²`), verified territory, and verified client data only.

3. **Honest Shading & Lighting Terminology**:
   - Replaced "Solar Analysis / Azimuth Simulation" with **`Daylight Illumination / Evening Atmosphere`** (Studio Lighting), ensuring visitors understand it is an interactive lighting visualization rather than a certified climatic analysis.

4. **Admin Credentials & Security Hardening**:
   - Purged all hardcoded passwords (`cvi-architects-2026!`) from source code, seed files, tests, scripts, README, and login UI.
   - Initial administrative access is now securely bootstrapped via environment variables (`ADMIN_BOOTSTRAP_PASSWORD`) or generated as a one-time random secret stored in local `.admin_bootstrap_credentials` (mode `0600`, gitignored).
   - Any previous development password must be rotated immediately in production.

---

## 2. Flagship Project Capability & Asset Audit

| Project | Available Real Assets | Verified Numeric Data | Supported Immersive Treatment | Unsupported Claims Removed | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Budoor Al-Najaf** | 8 Renders, Site Masterplan (`hzmq4d083wd.jpg`), Context Planning Aerial (`utggw0unuh8.png`) | Built Area: `500,000 m²`<br>Location: `Najaf, Iraq`<br>Client: `Al-Ghadeer`<br>Year: `2025` | **Interactive Masterplan & Zonal Strategy Viewer** (CAD Grid, high-res pan/zoom, zonal breakdowns) | Removed fabricated `+142.0m` height, `18 floors`, and generic tower model | **CORRECTED** |
| **Al-Fayha Towers** | 8 Renders (Daytime perspective `cpzt7jvy9z.png`, Evening luminous perspective `vnyiqvcpdh.png`, Balcony details) | Built Area: `14,224 m²`<br>Location: `Babylon, Iraq`<br>Client: `Private`<br>Year: `2025` | **Environmental Illumination Study** (Interactive Before/After day/night split slider) + 3D Perspective Card Tilt | Removed fabricated `185m` height, `24 floors`, and procedural tower massing | **CORRECTED** |
| **Mall AL-Ghadeer** | Ground Floor Plan (`st8dzozsmpb.jpg`), Façade Elevation (`q0vd8p1h27a.jpg`), Volumetric Diagram (`iy0cuhw74.jpg`) | Built Area: `3,900 m²`<br>Location: `Karbala, Iraq`<br>Client: `Al-Ghadeer` | **Architectural Drawing Triad** (Plan, Façade Elevation, Volumetric Concept diagram inspector) | Removed generic 3D placeholder | **CORRECTED** |
| **Albina Almarkazy Workshop** | Context Aerial (`9qr0tg4h1tb.png`), Plan-over-Site (`tnks4jykovg.jpg`), Technical Axonometric (`veyyqdsecp.png`) | Built Area: `128,325 m²`<br>Location: `Najaf, Iraq`<br>Client: `BMC Company`<br>Year: `2024` | **Axonometric & Logistics Plan Explorer** (Zoomable technical axonometric and truck loop plan) | Removed generic 3D model | **CORRECTED** |
| **Se7en Castle School Complex** | 8 Renders, Ground/First Floor Isometric Layout (`md9b1fqutp.jpg`), Campus Courtyards | Built Area: `13,180 m²`<br>Location: `Baghdad, Iraq`<br>Client: `Private`<br>Year: `2024` | **Isometric Campus Layout & Circulation Inspector** | Removed fabricated `38m` height, `8 floors`, and generic 3D massing | **CORRECTED** |
| **Budoor Zoo** | 11 Renders, Top-Down Wayfinding Loop (`zpnaryxa1.jpg`), Oblique Aerial (`8k57mnof55m.jpg`) | Built Area: `2,171 m²`<br>Location: `Baghdad, Iraq`<br>Client: `Al-Ghadeer`<br>Year: `2025` | **Wayfinding & Habitat Loop Spatial Flow** | Removed generic 3D building block | **CORRECTED** |
| **Administrative Building** | 5 Renders, Site Plan (`9v36j5vkgvu.jpg`), Top-Down Layout (`r8kpq0khq4o.jpg`), Central Dome | Built Area: `2,500 m²`<br>Location: `Baghdad, Iraq`<br>Client: `Private`<br>Year: `2023` | **Hexagonal Civic Geometry & Waterfront Site Plan** | Kept authentic site plan documentation | **CORRECTED** |
| **Client Villa Baghdad** | 8 Renders, Horizontal Contemporary Façade, Interior Living Spaces | Location: `Baghdad, Iraq`<br>Client: `Private`<br>Year: `2025` | **High-Density Editorial Case Study & Interior Spatial Sequencing** | None fabricated | **CORRECTED** |

---

## 3. Data Classification Framework

All platform data is strictly categorized into one of two tiers:

```
┌────────────────────────────────────────────────────────┐
│                   CVI DATA INTEGRITY                   │
└────────────────────────────────────────────────────────┘
          │                                  │
          ▼                                  ▼
   [ PROJECT_FACT ]                [ DESIGN_INTERACTION ]
   - Source: Authentic Resources   - Source: Art Direction / UX
   - Verified Built Area           - WebGL Shading (PBR/CAD/Clay)
   - Real Geographic Location      - Camera Motion & Inertia Orbit
   - True Client & Year            - Ambient Floating Dust Particles
   - Authentic CAD Linework        - Cursor Dynamic Perspective Tilt
   - Verified Project Typology     - Lighting (Daylight vs Evening)
```

### Classification Matrix
- **VERIFIED**: Explicitly stated in the primary source resources (e.g. `Budoor Al-Najaf: 500,000 m²`, `Al-Fayha Towers: 14,224 m²`).
- **DERIVED**: Logically extracted from authentic drawings/renders (e.g., day/night illumination pairs, axonometric bay counts).
- **DECORATIVE**: Visual affordances for atmosphere (e.g. CAD crosshair `+` symbols, ambient particle density, coordinate datum rings).
- **FABRICATED**: Invented measurements without source evidence (e.g., `+142.0 m elevation`, `18 levels`, fake solar calculations). **ALL PURGED.**

---

## 4. Homepage WebGL Spatial Experience

### Conceptual Foundation
The homepage spatial scene does **not** depict an invented building. Instead, it serves as a **Spatial Brand Armature**:
1. **Central Monolith**: Procedural sculptural geometry derived directly from the architectural vectors of the CVI brandmark (the curved shell `C`, converging cantilever blades `V`, and vertical structural pier `I`).
2. **Orbiting Project Panels**: Four authentic CVI project drawings and renders floating on spatial 3D planes at radius `4.8`:
   - Budoor Al-Najaf Zonal Masterplan
   - Al-Fayha Towers Evening Perspective
   - Mall Al-Ghadeer Façade Elevation
   - Albina Workshop Technical Axonometric
3. **Baghdad Urban Cartography**: High-resolution urban fabric of Baghdad (`33.2905° N, 44.3924° E`) serving as the deep spatial ground plane.
4. **Minimalist HUD**:
   - `VIEW`: Camera-linked cinematic trajectory vs. 360° Inspection Orbit.
   - `SHADING`: PBR Stone/Bronze, CAD Vector Wireframe, Clay Study Model.
   - `LIGHT`: Daylight Illumination vs. Evening Atmosphere.
   - Explicit disclaimer: `STUDIO BRAND ARTIFACT · NON-PROJECT GEOMETRY`.

---

## 5. Security & Authentication Audit

- **Vulnerability Identified**: The testing credentials (`admin` / `cvi-architects-2026!`) were previously present in plaintext across seed files, login UI helper messages, and README documentation.
- **Remediation**:
  1. Removed default password strings from all source files, seed routines, test scripts, and UI.
  2. Implemented dynamic bootstrap credential generation using Node.js `crypto` with chmod `0600` local file output.
  3. Enabled `.env.local` configuration via `ADMIN_BOOTSTRAP_PASSWORD`.
  4. Added `.admin_bootstrap_credentials` and `.env*.local` to `.gitignore`.
  5. Tested and verified that login APIs authenticate securely without hardcoded values.

---

© 2026 CVI Architects Ltd. Technical Documentation & Architectural Integrity Audit.

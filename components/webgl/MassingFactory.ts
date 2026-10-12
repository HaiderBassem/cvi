import * as THREE from 'three';
import type { ShadingMode } from './BrandTectonicArmature';

/**
 * Procedural, ILLUSTRATIVE building massing for every CVI typology.
 * These are conceptual volumes generated from a project's typology — they are
 * not the designed buildings, carry no measurements, and are always labeled so in the UI.
 */

export type MassingKind =
  | 'mosque'
  | 'villa'
  | 'residential'
  | 'campus'
  | 'commercial'
  | 'pavilion'
  | 'industrial'
  | 'healthcare'
  | 'civic'
  | 'leisure'
  | 'tower';

export const MASSING_LABELS: Record<MassingKind, string> = {
  mosque: 'Sacred hall, dome & minarets',
  villa: 'Stacked residence & courtyard pool',
  residential: 'Residential block cluster',
  campus: 'Courtyard campus',
  commercial: 'Podium & tower',
  pavilion: 'Commercial pavilion',
  industrial: 'Sawtooth sheds & silos',
  healthcare: 'Clinical wings',
  civic: 'Civic drum & dome',
  leisure: 'Pavilion park',
  tower: 'Stepped tower',
};

/** Pick the massing recipe from the project's title and typology (title keywords win). */
export function classifyProject(typology?: string | null, title?: string | null): MassingKind {
  const ty = (typology || '').toLowerCase();
  const ti = (title || '').toLowerCase();
  const has = (s: string, ...keys: string[]) => keys.some((k) => s.includes(k));

  if (has(ti, 'mosque', 'prayer', 'masjid') || has(ty, 'relig', 'sacred')) return 'mosque';
  if (has(ti, 'villa')) return 'villa';
  if (has(ti, 'industrial', 'workshop', 'factory') || has(ty, 'indust')) return 'industrial';
  if (has(ti, 'hospital', 'clinic', 'amal', 'hayat') || has(ty, 'health')) return 'healthcare';
  if (has(ti, 'zoo', 'park') || has(ty, 'entertain', 'leisure')) return 'leisure';
  if (has(ti, 'school', 'kindergarten', 'academy', 'university') || has(ty, 'educat')) return 'campus';
  if (has(ti, 'restaurant', 'mall', 'cafe')) return 'pavilion';
  if (has(ti, 'bank') || has(ty, 'commer')) return 'commercial';
  if (has(ti, 'admin', 'management', 'ministry') || has(ty, 'admin')) return 'civic';
  if (has(ti, 'tower')) return 'tower';
  if (has(ty, 'resid')) return 'residential';
  return 'tower';
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeRng(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Tone = 'glass' | 'stone' | 'solid';
type Rng = () => number;

const SKY = '#4cb8f5';

export class MassingFactory {
  private geos: THREE.BufferGeometry[] = [];
  private textures: THREE.Texture[] = [];
  private facades = new Map<string, THREE.MeshStandardMaterial>();
  private tiles = new Map<string, { map: HTMLCanvasElement; lit: HTMLCanvasElement }>();
  private night = false;

  private m = {
    stone: new THREE.MeshStandardMaterial({ color: '#e3eaef', roughness: 0.78, metalness: 0.04 }),
    stoneDark: new THREE.MeshStandardMaterial({ color: '#6c7c8a', roughness: 0.85, metalness: 0.05 }),
    roof: new THREE.MeshStandardMaterial({ color: '#c3cfd9', roughness: 0.9, metalness: 0.03 }),
    slate: new THREE.MeshStandardMaterial({ color: '#1d2a37', roughness: 0.92, metalness: 0.05 }),
    accent: new THREE.MeshStandardMaterial({ color: SKY, roughness: 0.32, metalness: 0.55, emissive: SKY, emissiveIntensity: 0 }),
    dome: new THREE.MeshStandardMaterial({ color: '#5cc0f2', roughness: 0.25, metalness: 0.5 }),
    glassDome: new THREE.MeshStandardMaterial({ color: '#9ad8fb', roughness: 0.08, metalness: 0.6, transparent: true, opacity: 0.62 }),
    water: new THREE.MeshStandardMaterial({ color: '#2f9fe0', roughness: 0.05, metalness: 0.7 }),
    grass: new THREE.MeshStandardMaterial({ color: '#4b8f78', roughness: 0.95, metalness: 0 }),
    track: new THREE.MeshStandardMaterial({ color: '#3b7ca0', roughness: 0.9, metalness: 0 }),
    tree: new THREE.MeshStandardMaterial({ color: '#3f8f7a', roughness: 0.9, flatShading: true }),
    trunk: new THREE.MeshStandardMaterial({ color: '#5a6672', roughness: 0.9 }),
    rim: new THREE.MeshBasicMaterial({ color: SKY, transparent: true, opacity: 0.7, side: THREE.DoubleSide }),
    edge: new THREE.LineBasicMaterial({ color: SKY, transparent: true, opacity: 0.45 }),
    wire: new THREE.MeshBasicMaterial({ color: SKY, wireframe: true }),
    clay: new THREE.MeshStandardMaterial({ color: '#eef3f6', roughness: 0.95, metalness: 0 }),
  };

  // ---------------------------------------------------------------- textures

  private tile(tone: 'glass' | 'stone') {
    const cached = this.tiles.get(tone);
    if (cached) return cached;

    const S = 256;
    const cell = S / 4;
    const mk = () => {
      const c = document.createElement('canvas');
      c.width = c.height = S;
      return c;
    };
    const map = mk();
    const lit = mk();
    const g = map.getContext('2d')!;
    const l = lit.getContext('2d')!;
    l.fillStyle = '#000';
    l.fillRect(0, 0, S, S);
    const rand = makeRng(tone === 'glass' ? 11 : 29);

    g.fillStyle = tone === 'glass' ? '#1f3a52' : '#e8eef2';
    g.fillRect(0, 0, S, S);

    for (let ix = 0; ix < 4; ix++) {
      for (let iy = 0; iy < 4; iy++) {
        const x = ix * cell;
        const y = iy * cell;
        const inset = tone === 'glass' ? 3 : 14;
        const insetY = tone === 'glass' ? 3 : 12;
        const w = cell - inset * 2;
        const h = cell - insetY * 2;

        if (tone === 'glass') {
          const grad = g.createLinearGradient(x, y, x, y + cell);
          grad.addColorStop(0, '#9bd8fa');
          grad.addColorStop(1, '#4d9bcb');
          g.fillStyle = grad;
        } else {
          g.fillStyle = '#2d5671';
        }
        g.fillRect(x + inset, y + insetY, w, h);

        // Sill line
        g.fillStyle = tone === 'glass' ? '#d6e6f1' : '#c4d0d9';
        g.fillRect(x + inset, y + cell - insetY - 2, w, 2);

        if (rand() < 0.5) {
          l.fillStyle = rand() < 0.5 ? '#dff1ff' : '#a9d9ff';
          l.fillRect(x + inset, y + insetY, w, h);
        }
      }
    }

    const out = { map, lit };
    this.tiles.set(tone, out);
    return out;
  }

  private facade(tone: 'glass' | 'stone', tx: number, ty: number): THREE.MeshStandardMaterial {
    const key = `${tone}|${tx}|${ty}`;
    const hit = this.facades.get(key);
    if (hit) return hit;

    const { map, lit } = this.tile(tone);
    const make = (canvas: HTMLCanvasElement) => {
      const t = new THREE.CanvasTexture(canvas);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(tx, ty);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      this.textures.push(t);
      return t;
    };

    const mat = new THREE.MeshStandardMaterial({
      map: make(map),
      emissiveMap: make(lit),
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: this.night ? 1.15 : 0,
      roughness: tone === 'glass' ? 0.26 : 0.72,
      metalness: tone === 'glass' ? 0.45 : 0.05,
    });
    this.facades.set(key, mat);
    return mat;
  }

  // ---------------------------------------------------------------- primitives

  private track<T extends THREE.BufferGeometry>(geo: T): T {
    this.geos.push(geo);
    return geo;
  }

  private box(
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    tone: Tone = 'stone',
    material?: THREE.Material
  ) {
    const geo = this.track(new THREE.BoxGeometry(w, h, d));
    let mats: THREE.Material | THREE.Material[];

    if (material) {
      mats = material;
    } else if (tone === 'solid' || h < 0.5) {
      mats = this.m.stone;
    } else {
      const t = tone === 'glass' ? 'glass' : 'stone';
      const ty = Math.max(1, Math.round(h / 1.68));
      const sx = this.facade(t, Math.max(1, Math.round(d / 2)), ty);
      const sz = this.facade(t, Math.max(1, Math.round(w / 2)), ty);
      mats = [sx, sx, this.m.roof, this.m.roof, sz, sz];
    }

    const mesh = new THREE.Mesh(geo, mats);
    mesh.position.set(x, y + h / 2, z);
    parent.add(mesh);
    return mesh;
  }

  private cyl(
    parent: THREE.Object3D,
    rTop: number,
    rBot: number,
    h: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material,
    segments = 32
  ) {
    const geo = this.track(new THREE.CylinderGeometry(rTop, rBot, h, segments));
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, y + h / 2, z);
    parent.add(mesh);
    return mesh;
  }

  private dome(parent: THREE.Object3D, r: number, x: number, y: number, z: number, material: THREE.Material) {
    const geo = this.track(new THREE.SphereGeometry(r, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2));
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  private cone(parent: THREE.Object3D, r: number, h: number, x: number, y: number, z: number, material: THREE.Material) {
    const mesh = new THREE.Mesh(this.track(new THREE.ConeGeometry(r, h, 24)), material);
    mesh.position.set(x, y + h / 2, z);
    parent.add(mesh);
    return mesh;
  }

  private tree(parent: THREE.Object3D, x: number, z: number, s = 1) {
    const trunk = new THREE.Mesh(this.track(new THREE.CylinderGeometry(0.035 * s, 0.05 * s, 0.32 * s, 6)), this.m.trunk);
    trunk.position.set(x, 0.16 * s, z);
    const crown = new THREE.Mesh(this.track(new THREE.IcosahedronGeometry(0.27 * s, 0)), this.m.tree);
    crown.position.set(x, 0.5 * s, z);
    parent.add(trunk, crown);
  }

  // ---------------------------------------------------------------- recipes

  private mosque(g: THREE.Group, r: Rng) {
    this.box(g, 6.4, 0.18, 6.4, 0, 0, 0, 'solid', this.m.stoneDark);
    this.box(g, 4.0, 1.5, 4.0, 0, 0.18, 0, 'stone');

    // Portico
    this.box(g, 4.0, 0.1, 0.9, 0, 1.1, 2.4, 'solid');
    for (let i = 0; i < 5; i++) {
      this.cyl(g, 0.06, 0.07, 0.92, -1.8 + i * 0.9, 0.18, 2.75, this.m.stone, 12);
    }

    // Main dome
    this.cyl(g, 1.25, 1.3, 0.45, 0, 1.68, 0, this.m.stone, 40);
    this.dome(g, 1.45, 0, 2.13, 0, this.m.dome);
    this.cyl(g, 0.02, 0.05, 0.75, 0, 3.55, 0, this.m.accent, 8);

    // Corner domelets
    [-1, 1].forEach((sx) =>
      [-1, 1].forEach((sz) => {
        this.cyl(g, 0.38, 0.4, 0.22, sx * 1.55, 1.68, sz * 1.55, this.m.stone, 20);
        this.dome(g, 0.45, sx * 1.55, 1.9, sz * 1.55, this.m.dome);
      })
    );

    // Minarets
    const mh = 4.2 + r() * 0.6;
    [-1, 1].forEach((sx) => {
      const x = sx * 3.0;
      const z = 2.6;
      this.cyl(g, 0.13, 0.18, mh, x, 0.18, z, this.m.stone, 20);
      this.cyl(g, 0.28, 0.28, 0.09, x, mh * 0.78, z, this.m.stone, 20);
      this.cyl(g, 0.1, 0.12, 0.7, x, mh * 0.78 + 0.09, z, this.m.stone, 20);
      this.cone(g, 0.2, 0.55, x, 0.18 + mh, z, this.m.dome);
    });
  }

  private villa(g: THREE.Group, r: Rng) {
    const s = r() < 0.5 ? 1 : -1;
    this.box(g, 5.4, 0.1, 4.8, 0, 0, 0, 'solid', this.m.stoneDark);
    this.box(g, 4.6, 1.05, 2.8, -0.2 * s, 0.1, -0.4, 'glass');
    this.box(g, 3.3, 1.0, 2.4, 0.7 * s, 1.15, -0.5, 'stone');
    this.box(g, 3.9, 0.1, 2.8, 0.5 * s, 2.15, -0.5, 'solid', this.m.roof);
    // Cantilevered canopy
    this.box(g, 4.4, 0.08, 1.0, -0.2 * s, 1.15, 1.35, 'solid', this.m.accent);
    // Pool + deck
    this.box(g, 3.2, 0.05, 1.5, -0.4 * s, 0.1, 1.95, 'solid', this.m.stoneDark);
    this.box(g, 2.5, 0.07, 1.0, -0.4 * s, 0.1, 1.95, 'solid', this.m.water);
    // Garage
    this.box(g, 1.3, 0.8, 1.7, -2.0 * s, 0.1, -1.5, 'stone');
  }

  private residential(g: THREE.Group, r: Rng) {
    this.box(g, 6.6, 0.3, 6.6, 0, 0, 0, 'solid', this.m.stoneDark);
    const tallest = Math.floor(r() * 4);
    let i = 0;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const w = 1.8 + r() * 0.5;
        const d = 1.8 + r() * 0.5;
        const x = sx * 1.75 + (r() - 0.5) * 0.3;
        const z = sz * 1.75 + (r() - 0.5) * 0.3;
        const h = i === tallest ? 5.4 + r() * 0.8 : 2.2 + r() * 2.6;
        const tone: Tone = r() < 0.5 ? 'glass' : 'stone';
        this.box(g, w, h, d, x, 0.3, z, tone);
        if (i === tallest) {
          this.box(g, w * 0.7, 0.8, d * 0.7, x, 0.3 + h, z, 'stone');
        } else {
          this.box(g, w * 0.4, 0.22, d * 0.4, x, 0.3 + h, z, 'solid', this.m.stoneDark);
        }
        i++;
      }
    }
    this.cyl(g, 0.85, 0.85, 0.04, 0, 0.3, 0, this.m.grass, 40);
  }

  private campus(g: THREE.Group, r: Rng) {
    this.box(g, 7.2, 0.08, 7.0, 0, 0, 0.3, 'solid', this.m.stoneDark);
    const h = 1.2 + r() * 0.2;
    this.box(g, 6.4, h, 1.5, 0, 0.08, -2.4, 'stone');
    this.box(g, 1.5, h, 4.0, -2.45, 0.08, -0.15, 'stone');
    this.box(g, 1.5, h, 4.0, 2.45, 0.08, -0.15, 'stone');
    this.box(g, 1.3, 2.5, 1.3, 0, 0.08, -2.4, 'glass');
    this.box(g, 1.5, 0.1, 0.7, 0, 0.78, -1.5, 'solid', this.m.accent);
    this.cyl(g, 1.0, 1.0, 0.04, 0, 0.08, -0.1, this.m.grass, 40);
    // Sports field + track
    this.box(g, 3.2, 0.05, 2.0, 0, 0.08, 3.1, 'solid', this.m.track);
    this.box(g, 2.5, 0.06, 1.3, 0, 0.08, 3.1, 'solid', this.m.grass);
  }

  private commercial(g: THREE.Group, r: Rng) {
    this.box(g, 6.2, 0.1, 5.2, 0, 0, 0.3, 'solid', this.m.stoneDark);
    this.box(g, 5.8, 0.85, 4.4, 0, 0.1, 0.5, 'glass');
    this.box(g, 6.0, 0.08, 1.0, 0, 0.95, 3.0, 'solid', this.m.accent);
    this.box(g, 2.0, 1.3, 2.0, -1.8, 0.95, 1.2, 'glass');
    const h = 3.8 + r() * 1.6;
    this.box(g, 2.1, h, 2.1, 1.6, 0.95, -0.4, 'glass');
    this.box(g, 0.14, 1.0, 2.1, 1.6, 0.95 + h, -0.4, 'solid', this.m.accent);
  }

  private pavilion(g: THREE.Group, r: Rng) {
    const s = r() < 0.5 ? 1 : -1;
    this.box(g, 6.2, 0.1, 5.0, 0, 0, 0, 'solid', this.m.stoneDark);
    this.box(g, 5.2, 0.95, 3.2, -0.2, 0.1, -0.3, 'glass');
    this.box(g, 4.0, 0.9, 2.6, 0.6, 1.05, -0.3, 'stone');
    this.box(g, 4.6, 0.1, 3.0, 0.5, 1.95, -0.3, 'solid', this.m.roof);
    this.box(g, 4.4, 0.08, 1.3, -0.2, 1.05, 1.85, 'solid', this.m.accent);
    for (let i = 0; i < 4; i++) {
      this.cyl(g, 0.05, 0.05, 0.95, -2.0 + i * 1.3, 0.1, 2.35, this.m.stone, 10);
    }
    this.box(g, 0.14, 1.4, 0.14, 2.7 * s, 0.1, 1.7, 'solid', this.m.accent);
  }

  private sawtooth(g: THREE.Group, w: number, d: number, teeth: number, x: number, y: number, z: number) {
    const th = 0.42;
    const tw = w / teeth;
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    for (let i = 0; i < teeth; i++) {
      shape.lineTo(i * tw, th);
      shape.lineTo((i + 1) * tw, 0);
    }
    shape.lineTo(0, 0);
    const geo = this.track(new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false }));
    const mesh = new THREE.Mesh(geo, this.m.roof);
    mesh.position.set(x - w / 2, y, z - d / 2);
    g.add(mesh);
  }

  private industrial(g: THREE.Group, r: Rng) {
    this.box(g, 7.4, 0.08, 6.2, 0, 0, 0, 'solid', this.m.slate);
    [-1.5, 0.4].forEach((z) => {
      this.box(g, 4.6, 0.95, 1.5, -0.7, 0.08, z, 'solid', this.m.stone);
      this.sawtooth(g, 4.6, 1.5, 5, -0.7, 1.03, z);
    });
    this.box(g, 1.5, 1.4, 1.5, -2.9, 0.08, 2.3, 'glass');
    const n = 2 + Math.floor(r() * 2);
    for (let i = 0; i < n; i++) {
      const z = -2.2 + i * 1.05;
      this.cyl(g, 0.42, 0.42, 2.2, 2.6, 0.08, z, this.m.stone, 24);
      this.cone(g, 0.44, 0.4, 2.6, 2.28, z, this.m.stoneDark);
    }
    this.cyl(g, 0.11, 0.17, 3.2, -2.9, 0.08, -2.4, this.m.stoneDark, 14);
    for (let i = 0; i < 6; i++) {
      this.box(g, 0.62, 0.26, 0.26, -1.8 + i * 0.68, 0.08, 2.4, 'solid', i % 2 ? this.m.accent : this.m.stoneDark);
    }
  }

  private healthcare(g: THREE.Group, r: Rng) {
    this.box(g, 6.6, 0.08, 6.0, 0, 0, 0, 'solid', this.m.stoneDark);
    const hA = 1.7 + r() * 0.5;
    this.box(g, 1.6, hA, 5.0, -2.1, 0.08, 0, 'stone');
    this.box(g, 1.6, hA + 0.5, 5.0, 2.1, 0.08, 0, 'glass');
    this.box(g, 2.8, 1.1, 1.3, 0, 0.08, 0, 'glass');
    this.box(g, 2.2, 0.08, 1.1, 0, 0.83, 2.8, 'solid', this.m.accent);
    // Roof cross
    const top = 0.08 + hA + 0.5;
    this.box(g, 0.2, 0.08, 0.8, 2.1, top, 0, 'solid', this.m.accent);
    this.box(g, 0.8, 0.08, 0.2, 2.1, top, 0, 'solid', this.m.accent);
  }

  private civic(g: THREE.Group) {
    this.cyl(g, 3.5, 3.7, 0.16, 0, 0, 0, this.m.stoneDark, 6);
    this.cyl(g, 3.1, 3.3, 0.16, 0, 0.16, 0, this.m.stone, 6);

    const drum = new THREE.Mesh(this.track(new THREE.CylinderGeometry(2.3, 2.3, 1.9, 6)), this.facade('glass', 12, 1));
    drum.position.set(0, 0.32 + 0.95, 0);
    g.add(drum);

    this.cyl(g, 2.5, 2.5, 0.14, 0, 2.22, 0, this.m.stone, 6);
    this.dome(g, 1.3, 0, 2.36, 0, this.m.glassDome);
    this.cyl(g, 0.02, 0.05, 0.7, 0, 3.66, 0, this.m.accent, 8);

    // Colonnade
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      this.cyl(g, 0.06, 0.07, 1.9, Math.cos(a) * 2.8, 0.32, Math.sin(a) * 2.8, this.m.stone, 10);
    }
    const ring = new THREE.Mesh(this.track(new THREE.TorusGeometry(2.8, 0.05, 8, 48)), this.m.accent);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 2.24;
    g.add(ring);
  }

  private leisure(g: THREE.Group, r: Rng) {
    this.cyl(g, 4.4, 4.4, 0.05, 0, 0, 0, this.m.grass, 56);
    this.cyl(g, 1.15, 1.15, 0.03, 0, 0.05, 0, this.m.water, 40);
    const path = new THREE.Mesh(this.track(new THREE.TorusGeometry(2.4, 0.05, 6, 64)), this.m.stone);
    path.rotation.x = Math.PI / 2;
    path.position.y = 0.07;
    g.add(path);

    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4 + r() * 0.3;
      const rad = 3.0 + r() * 0.3;
      const x = Math.cos(a) * rad;
      const z = Math.sin(a) * rad;
      const pr = 0.75 + r() * 0.3;
      this.cyl(g, pr, pr, 0.62, x, 0.05, z, this.m.stone, 32);
      this.dome(g, pr + 0.05, x, 0.67, z, i % 2 ? this.m.dome : this.m.glassDome);
    }
    for (let i = 0; i < 10; i++) {
      const a = r() * Math.PI * 2;
      const rad = 1.7 + r() * 0.5;
      this.tree(g, Math.cos(a) * rad, Math.sin(a) * rad, 0.9 + r() * 0.4);
    }
  }

  private tower(g: THREE.Group, r: Rng) {
    this.box(g, 4.4, 0.5, 4.4, 0, 0, 0, 'glass');
    this.box(g, 4.6, 0.08, 4.6, 0, 0.5, 0, 'solid', this.m.accent);
    const h = 4.6 + r() * 1.8;
    this.box(g, 2.2, h, 2.2, 0, 0.58, 0, 'glass');
    this.box(g, 1.6, 1.2, 1.6, 0, 0.58 + h, 0, 'stone');
    this.cyl(g, 0.02, 0.06, 1.3, 0, 1.78 + h, 0, this.m.accent, 8);
  }

  // ---------------------------------------------------------------- public API

  /** Builds a building (base at y=0, centered on the origin, footprint within ~radius 5). */
  build(kind: MassingKind, seed: string, opts: { site?: boolean; edges?: boolean } = {}): THREE.Group {
    const root = new THREE.Group();
    root.name = `massing-${kind}`;

    const building = new THREE.Group();
    root.add(building);
    this[kind](building, makeRng(hashSeed(seed)));

    if (opts.site) {
      const site = new THREE.Group();
      root.add(site);

      const base = new THREE.Mesh(this.track(new THREE.CylinderGeometry(5.9, 6.1, 0.3, 72)), this.m.slate);
      base.position.y = -0.15;
      site.add(base);

      const rim = new THREE.Mesh(this.track(new THREE.RingGeometry(5.7, 5.78, 96)), this.m.rim);
      rim.rotation.x = -Math.PI / 2;
      rim.position.y = 0.003;
      site.add(rim);

      if (kind !== 'leisure') {
        const rt = makeRng(hashSeed(seed + ':trees'));
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2 + rt() * 0.3;
          const rad = 5.05 + rt() * 0.4;
          this.tree(site, Math.cos(a) * rad, Math.sin(a) * rad, 0.85 + rt() * 0.5);
        }
      }
    }

    root.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });

    if (opts.edges) {
      const boxes: THREE.Mesh[] = [];
      building.traverse((o) => {
        if (o instanceof THREE.Mesh && o.geometry instanceof THREE.BoxGeometry) boxes.push(o);
      });
      boxes.forEach((m) => {
        const eg = this.track(new THREE.EdgesGeometry(m.geometry));
        m.add(new THREE.LineSegments(eg, this.m.edge));
      });
    }

    return root;
  }

  setMode(root: THREE.Object3D, mode: ShadingMode) {
    root.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      if (!o.userData.orig) o.userData.orig = o.material;
      o.material = mode === 'wireframe' ? this.m.wire : mode === 'clay' ? this.m.clay : o.userData.orig;
    });
  }

  setNight(night: boolean) {
    this.night = night;
    this.facades.forEach((mat) => {
      mat.emissiveIntensity = night ? 1.15 : 0;
    });
    this.m.accent.emissiveIntensity = night ? 0.9 : 0;
    this.m.edge.opacity = night ? 0.75 : 0.45;
  }

  dispose() {
    this.geos.forEach((g) => g.dispose());
    this.textures.forEach((t) => t.dispose());
    this.facades.forEach((m) => m.dispose());
    Object.values(this.m).forEach((m) => m.dispose());
    this.geos = [];
    this.textures = [];
    this.facades.clear();
    this.tiles.clear();
  }
}

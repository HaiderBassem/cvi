import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Real 3D city context from open data (see scripts/geo/build_city_context.py):
 * Overture Maps building footprints extruded to their mapped height, or to the
 * JRC GHS-BUILT-H satellite-derived average height where none is mapped.
 * Everything is merged into one mesh so a few thousand buildings draw in one call.
 */

export type HeightSource = 'm' | 'f' | 'g' | 'd';

export interface CityData {
  key: string;
  name: string;
  center: [number, number];
  radius_m: number;
  approximate: boolean;
  generated_at: string;
  sources: { footprints: string; heights: string };
  stats: { buildings: number; measured: number; floors: number; ghsl: number; default: number };
  buildings: { h: number; s: HeightSource; p: [number, number][] }[];
}

export const CITY_ATTRIBUTION =
  'Buildings © OpenStreetMap contributors, Microsoft — via Overture Maps Foundation · Heights: mapped data or JRC GHS-BUILT-H 2018';

const cache = new Map<string, Promise<CityData>>();

export function loadCity(key: string): Promise<CityData> {
  if (!/^[a-z0-9-]+$/.test(key)) return Promise.reject(new Error('Invalid place key'));
  let p = cache.get(key);
  if (!p) {
    p = fetch(`/geo/${key}.json`).then((r) => {
      if (!r.ok) throw new Error(`City data ${key} unavailable (${r.status})`);
      return r.json() as Promise<CityData>;
    });
    p.catch(() => cache.delete(key));
    cache.set(key, p);
  }
  return p;
}

export interface CityMeshOptions {
  /** Real metres per scene unit. */
  metresPerUnit: number;
  /** Optional cap on how far from the centre to keep buildings (metres). */
  maxRadius?: number;
}

const LOW = new THREE.Color('#eef1f3');
const HIGH = new THREE.Color('#3aa9ec');

export function buildCityMesh(data: CityData, opts: CityMeshOptions) {
  const s = 1 / opts.metresPerUnit;
  const geos: THREE.BufferGeometry[] = [];
  const maxH = Math.max(12, ...data.buildings.map((b) => b.h));
  const tmp = new THREE.Color();

  for (const b of data.buildings) {
    if (b.p.length < 3) continue;
    if (opts.maxRadius) {
      const [x, z] = b.p[0];
      if (Math.hypot(x, z) > opts.maxRadius) continue;
    }

    let pts = b.p.map(([x, z]) => new THREE.Vector2(x * s, z * s));
    if (THREE.ShapeUtils.isClockWise(pts)) pts = pts.reverse();
    const shape = new THREE.Shape(pts);

    let geo: THREE.BufferGeometry;
    try {
      geo = new THREE.ExtrudeGeometry(shape, { depth: Math.max(2.5, b.h) * s, bevelEnabled: false });
    } catch {
      continue;
    }
    // Shape is drawn in the XY plane (y = north); stand it up so height runs along +Y and north is -Z.
    geo.rotateX(-Math.PI / 2);
    geo.deleteAttribute('uv');

    // Colour by height: low fabric in pale concrete, taller buildings shift toward sky blue.
    tmp.copy(LOW).lerp(HIGH, Math.min(1, Math.pow(b.h / maxH, 1.6)));
    const count = geo.getAttribute('position').count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geos.push(geo);
  }

  const merged = geos.length ? mergeGeometries(geos, false) : new THREE.BufferGeometry();
  geos.forEach((g) => g.dispose());
  merged.computeBoundingSphere();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.82,
    metalness: 0.05,
    emissive: new THREE.Color('#0b2a44'),
    emissiveIntensity: 0,
  });
  const mesh = new THREE.Mesh(merged, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = `real-city-${data.key}`;

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(merged, 30),
    new THREE.LineBasicMaterial({ color: '#4cb8f5', transparent: true, opacity: 0.18 })
  );
  mesh.add(edges);

  return {
    mesh,
    setNight(night: boolean) {
      material.emissiveIntensity = night ? 0.9 : 0;
      (edges.material as THREE.LineBasicMaterial).opacity = night ? 0.45 : 0.18;
    },
    setMode(mode: 'pbr' | 'clay' | 'wireframe') {
      material.wireframe = mode === 'wireframe';
      material.vertexColors = mode !== 'clay';
      material.color.set(mode === 'clay' ? '#eef3f6' : '#ffffff');
      material.needsUpdate = true;
      edges.visible = mode !== 'wireframe';
    },
    dispose() {
      merged.dispose();
      material.dispose();
      edges.geometry.dispose();
      (edges.material as THREE.Material).dispose();
    },
  };
}

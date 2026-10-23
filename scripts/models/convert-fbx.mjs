#!/usr/bin/env node
/**
 * FBX → web GLB converter for the project backgrounds.
 *
 *   npm run models:build                 # every model in sources.mjs
 *   npm run models:build -- budoor-zoo   # one model by id
 *
 * The studio's FBX exports (Revit / 3ds Max) are 2–110 MB, carry no textures and a single
 * grey material, but their object names keep the Revit category ("System_Panel_Glazed",
 * "Railing_…", "Toposolid_…"). We use those names to sort the geometry into a handful of
 * finish classes (stone, glass, metal, wood, ground, water, green). Per class: weld →
 * simplify (meshoptimizer) → crease-smoothed normals. Feature edges are baked as a LINES
 * primitive. The result is normalised (Y-up, centred, base on y = 0, ~100 units across)
 * and written as a meshopt-compressed GLB that streams in a few seconds.
 *
 * Output: public/models/projects/<id>.glb  +  lib/models/generated.json (sizes, framing).
 *
 * Single file (used by the admin's 3D upload):
 *   node scripts/models/convert-fbx.mjs --file in.fbx --id my-model --label "My model" --out data/models
 * prints one line `RESULT {json}` when done.
 */
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { Document, NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions';
import { quantize, reorder, meshopt, prune, dedup } from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder } from 'meshoptimizer';

import { pathToFileURL } from 'node:url';
import { SOURCES } from './sources.mjs';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'public', 'models', 'projects');
const REPORT = path.join(ROOT, 'lib', 'models', 'generated.json');

/** Triangle budget for the building geometry (all classes but the ground), and for the ground. */
const BUDGET_TRIS = 220_000;
const GROUND_TRIS = 24_000;
/** Longest model dimension after normalisation. */
const NORMALISED_SPAN = 100;
const MAX_EDGES = 90_000;
const CREASE_DEG = 38;
const EDGE_DEG = 34;

// ---- Node shims so three's FBXLoader runs outside a browser ---------------------------
globalThis.window = { innerWidth: 1920, innerHeight: 1080 };
THREE.ImageLoader.prototype.load = function () {
  return {}; // there are no textures to fetch
};
const realWarn = console.warn;
console.warn = (...a) => {
  if (String(a[0]).includes('Orthographic')) return;
  realWarn(...a);
};

// ---- Revit category → finish class ------------------------------------------------------
/** Order matters: the first matching rule wins. */
const CLASS_RULES = [
  [
    'drop', // interior fittings and entourage: invisible from outside, expensive in triangles
    /(lighting|luminaire|light[_-]?fixture|^pil_|^cpl_|casework|furniture|chair|\btable|sofa|bed_|\bsink|toilet|\bwc_|plumbing|\bduct|\bpipe|sprinkler|camera|speaker|equipment|entourage|people|person|human|\bcar\b|vehicle|parking_space)/i,
  ],
  ['water', /(water|\bpool|fountain|\blake|\bpond)/i],
  ['glass', /(glaz|glass|curtain[_-]?(panel|wall)|window|skylight|زجاج|شباك|نافذ)/i],
  ['metal', /(mullion|railing|rail\b|handrail|fence|louver|louvre|grille|\bgate|balustrade|frame|canopy|steel|pergola)/i],
  ['stone', /wall/i], // keeps "Site_Wall", "Garden_Wall" out of the ground / green rules
  ['green', /(\btree|\bplant|shrub|grass|lawn|veget|planting|hedge|flower|\bpalm|topiary)/i],
  ['ground', /(toposolid|topograph|terrain|\bground|\broad|asphalt|\bpave|sidewalk|walkway|curb|kerb|landscape|parcel|plaza|\bsite\b|street)/i],
  ['wood', /(door|باب|timber|wood|\bdeck|joinery)/i],
];

function classify(name) {
  for (const [cls, re] of CLASS_RULES) if (re.test(name)) return cls;
  return 'stone';
}

/** glTF base finishes. The site recolours these by name at runtime (see lib/models/finishes.ts). */
const FINISH = {
  stone: { color: [0.86, 0.82, 0.74], rough: 0.78, metal: 0 },
  glass: { color: [0.52, 0.76, 0.92], rough: 0.08, metal: 0.1 },
  metal: { color: [0.36, 0.33, 0.3], rough: 0.42, metal: 0.7 },
  wood: { color: [0.5, 0.36, 0.24], rough: 0.62, metal: 0 },
  ground: { color: [0.13, 0.15, 0.18], rough: 0.95, metal: 0 },
  water: { color: [0.13, 0.36, 0.52], rough: 0.12, metal: 0.2 },
  green: { color: [0.22, 0.38, 0.3], rough: 0.9, metal: 0 },
};

// ---- geometry helpers ------------------------------------------------------------------
/** Percentile of a numeric array. */
function percentile(values, p) {
  if (!values.length) return 0;
  const s = Float64Array.from(values).sort();
  return s[Math.min(s.length - 1, Math.max(0, Math.floor(p * (s.length - 1))))];
}

/**
 * Weld duplicate positions (FBX stores every triangle corner separately) into an indexed mesh.
 * `grid` is the snapping size. Open-addressing hash on the quantised coordinates.
 */
function weld(pos, grid) {
  const n = pos.length / 3;
  const cap = 1 << Math.ceil(Math.log2(Math.max(16, n * 2)));
  const mask = cap - 1;
  const table = new Int32Array(cap).fill(-1);
  const remap = new Uint32Array(n);
  const out = new Float32Array(n * 3);
  const qx = new Int32Array(n);
  const qy = new Int32Array(n);
  const qz = new Int32Array(n);
  let unique = 0;
  const inv = 1 / grid;
  for (let i = 0; i < n; i++) {
    const x = Math.round(pos[i * 3] * inv);
    const y = Math.round(pos[i * 3 + 1] * inv);
    const z = Math.round(pos[i * 3 + 2] * inv);
    let h = (Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791)) >>> 0;
    h &= mask;
    for (;;) {
      const slot = table[h];
      if (slot === -1) {
        table[h] = unique;
        qx[unique] = x;
        qy[unique] = y;
        qz[unique] = z;
        out[unique * 3] = pos[i * 3];
        out[unique * 3 + 1] = pos[i * 3 + 1];
        out[unique * 3 + 2] = pos[i * 3 + 2];
        remap[i] = unique++;
        break;
      }
      if (qx[slot] === x && qy[slot] === y && qz[slot] === z) {
        remap[i] = slot;
        break;
      }
      h = (h + 1) & mask;
    }
  }
  return { positions: out.slice(0, unique * 3), remap };
}

/** Indexed triangle mesh from corner positions, with degenerate triangles removed. */
function buildIndexed(cornerPositions, grid) {
  const { positions, remap } = weld(cornerPositions, grid);
  const tris = remap.length / 3;
  const idx = new Uint32Array(remap.length);
  let n = 0;
  for (let t = 0; t < tris; t++) {
    const a = remap[t * 3];
    const b = remap[t * 3 + 1];
    const c = remap[t * 3 + 2];
    if (a === b || b === c || a === c) continue;
    idx[n++] = a;
    idx[n++] = b;
    idx[n++] = c;
  }
  return compact({ positions, indices: idx.slice(0, n) });
}

/** Drop vertices that are no longer referenced. */
function compact(mesh) {
  const used = new Int32Array(mesh.positions.length / 3).fill(-1);
  let n = 0;
  const idx = new Uint32Array(mesh.indices.length);
  for (let i = 0; i < mesh.indices.length; i++) {
    const v = mesh.indices[i];
    if (used[v] === -1) used[v] = n++;
    idx[i] = used[v];
  }
  const pos = new Float32Array(n * 3);
  for (let v = 0; v < used.length; v++) {
    if (used[v] === -1) continue;
    pos[used[v] * 3] = mesh.positions[v * 3];
    pos[used[v] * 3 + 1] = mesh.positions[v * 3 + 1];
    pos[used[v] * 3 + 2] = mesh.positions[v * 3 + 2];
  }
  return { positions: pos, indices: idx };
}

/** Reduce a mesh to roughly `targetTris` triangles with meshoptimizer. */
function simplifyMesh(mesh, targetTris) {
  if (mesh.indices.length / 3 <= targetTris) return mesh;
  const target = Math.max(3, Math.floor(targetTris)) * 3;
  let [indices] = MeshoptSimplifier.simplify(mesh.indices, mesh.positions, 3, target, 0.05, []);
  if (indices.length > target * 1.35) {
    // Topology-bound (lots of thin open sheets): fall back to the sloppy simplifier.
    [indices] = MeshoptSimplifier.simplifySloppy(mesh.indices, mesh.positions, 3, null, target, 0.25);
  }
  return compact({ positions: mesh.positions, indices });
}

/**
 * Crease-angle smooth normals: each triangle corner averages the (area-weighted) normals of
 * the faces around its vertex that lie within CREASE_DEG of its own face. Corners with the
 * same position and normal are merged again, so curved shells read smooth while walls,
 * slabs and parapets stay crisp.
 */
function smoothNormals(mesh) {
  const { positions, indices } = mesh;
  const triCount = indices.length / 3;
  const vCount = positions.length / 3;
  const fn = new Float32Array(triCount * 3); // area-weighted face normals
  const fnUnit = new Float32Array(triCount * 3);
  for (let t = 0; t < triCount; t++) {
    const a = indices[t * 3] * 3;
    const b = indices[t * 3 + 1] * 3;
    const c = indices[t * 3 + 2] * 3;
    const ux = positions[b] - positions[a];
    const uy = positions[b + 1] - positions[a + 1];
    const uz = positions[b + 2] - positions[a + 2];
    const vx = positions[c] - positions[a];
    const vy = positions[c + 1] - positions[a + 1];
    const vz = positions[c + 2] - positions[a + 2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    fn[t * 3] = nx;
    fn[t * 3 + 1] = ny;
    fn[t * 3 + 2] = nz;
    const len = Math.hypot(nx, ny, nz) || 1;
    fnUnit[t * 3] = nx / len;
    fnUnit[t * 3 + 1] = ny / len;
    fnUnit[t * 3 + 2] = nz / len;
  }
  // vertex → faces (CSR)
  const start = new Uint32Array(vCount + 1);
  for (let i = 0; i < indices.length; i++) start[indices[i] + 1]++;
  for (let v = 0; v < vCount; v++) start[v + 1] += start[v];
  const fill = start.slice(0, vCount);
  const faces = new Uint32Array(indices.length);
  for (let t = 0; t < triCount; t++) for (let k = 0; k < 3; k++) faces[fill[indices[t * 3 + k]]++] = t;

  const cosCrease = Math.cos((CREASE_DEG * Math.PI) / 180);
  const cornerNormals = new Float32Array(indices.length * 3);
  for (let t = 0; t < triCount; t++) {
    const ux = fnUnit[t * 3];
    const uy = fnUnit[t * 3 + 1];
    const uz = fnUnit[t * 3 + 2];
    for (let k = 0; k < 3; k++) {
      const v = indices[t * 3 + k];
      let sx = 0;
      let sy = 0;
      let sz = 0;
      for (let j = start[v]; j < start[v + 1]; j++) {
        const f = faces[j];
        if (fnUnit[f * 3] * ux + fnUnit[f * 3 + 1] * uy + fnUnit[f * 3 + 2] * uz >= cosCrease) {
          sx += fn[f * 3];
          sy += fn[f * 3 + 1];
          sz += fn[f * 3 + 2];
        }
      }
      const len = Math.hypot(sx, sy, sz) || 1;
      const o = (t * 3 + k) * 3;
      cornerNormals[o] = sx / len;
      cornerNormals[o + 1] = sy / len;
      cornerNormals[o + 2] = sz / len;
    }
  }

  // Re-index: merge corners sharing a vertex and (quantised) normal.
  const map = new Map();
  const outPos = [];
  const outNor = [];
  const outIdx = new Uint32Array(indices.length);
  for (let i = 0; i < indices.length; i++) {
    const v = indices[i];
    const key = `${v}|${Math.round(cornerNormals[i * 3] * 60)}|${Math.round(cornerNormals[i * 3 + 1] * 60)}|${Math.round(cornerNormals[i * 3 + 2] * 60)}`;
    let id = map.get(key);
    if (id === undefined) {
      id = outPos.length / 3;
      map.set(key, id);
      outPos.push(positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]);
      outNor.push(cornerNormals[i * 3], cornerNormals[i * 3 + 1], cornerNormals[i * 3 + 2]);
    }
    outIdx[i] = id;
  }
  return { positions: Float32Array.from(outPos), normals: Float32Array.from(outNor), indices: outIdx };
}

/** Ground and water read best with flat, upward normals; keeps the plinth calm. */
function flatUp(mesh) {
  const normals = new Float32Array(mesh.positions.length);
  for (let i = 1; i < normals.length; i += 3) normals[i] = 1;
  const idx = Uint32Array.from(mesh.indices);
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3;
    const b = idx[t + 1] * 3;
    const c = idx[t + 2] * 3;
    const ux = mesh.positions[b] - mesh.positions[a];
    const uz = mesh.positions[b + 2] - mesh.positions[a + 2];
    const vx = mesh.positions[c] - mesh.positions[a];
    const vz = mesh.positions[c + 2] - mesh.positions[a + 2];
    if (uz * vx - ux * vz < 0) {
      const swap = idx[t + 1];
      idx[t + 1] = idx[t + 2];
      idx[t + 2] = swap;
    }
  }
  return { positions: mesh.positions, normals, indices: idx };
}

/** Sharp-edge line segments of an indexed mesh (creases + open borders), longest first. */
function featureEdges(mesh, minLen, limit) {
  const { positions, indices } = mesh;
  const triCount = indices.length / 3;
  const faceN = new Float32Array(triCount * 3);
  for (let t = 0; t < triCount; t++) {
    const a = indices[t * 3] * 3;
    const b = indices[t * 3 + 1] * 3;
    const c = indices[t * 3 + 2] * 3;
    const ux = positions[b] - positions[a];
    const uy = positions[b + 1] - positions[a + 1];
    const uz = positions[b + 2] - positions[a + 2];
    const vx = positions[c] - positions[a];
    const vy = positions[c + 1] - positions[a + 1];
    const vz = positions[c + 2] - positions[a + 2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    faceN[t * 3] = nx / len;
    faceN[t * 3 + 1] = ny / len;
    faceN[t * 3 + 2] = nz / len;
  }
  const edges = new Map();
  const add = (a, b, t) => {
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    const key = lo * 4294967296 + hi;
    const e = edges.get(key);
    if (e) {
      e.t2 = t;
      e.n++;
    } else edges.set(key, { a: lo, b: hi, t1: t, t2: -1, n: 1 });
  };
  for (let t = 0; t < triCount; t++) {
    const i0 = indices[t * 3];
    const i1 = indices[t * 3 + 1];
    const i2 = indices[t * 3 + 2];
    add(i0, i1, t);
    add(i1, i2, t);
    add(i2, i0, t);
  }
  const cosEdge = Math.cos((EDGE_DEG * Math.PI) / 180);
  const out = [];
  for (const e of edges.values()) {
    let keep = false;
    if (e.n === 1) keep = true;
    else if (e.n === 2) {
      const d = faceN[e.t1 * 3] * faceN[e.t2 * 3] + faceN[e.t1 * 3 + 1] * faceN[e.t2 * 3 + 1] + faceN[e.t1 * 3 + 2] * faceN[e.t2 * 3 + 2];
      keep = d < cosEdge;
    }
    if (!keep) continue;
    const len = Math.hypot(
      positions[e.a * 3] - positions[e.b * 3],
      positions[e.a * 3 + 1] - positions[e.b * 3 + 1],
      positions[e.a * 3 + 2] - positions[e.b * 3 + 2]
    );
    if (len >= minLen) out.push({ a: e.a, b: e.b, len });
  }
  out.sort((x, y) => y.len - x.len);
  const take = out.slice(0, limit);
  const seg = new Float32Array(take.length * 6);
  take.forEach((e, i) => {
    seg.set(positions.subarray(e.a * 3, e.a * 3 + 3), i * 6);
    seg.set(positions.subarray(e.b * 3, e.b * 3 + 3), i * 6 + 3);
  });
  return seg;
}

// ---- main conversion ---------------------------------------------------------------------
await MeshoptSimplifier.ready;
await MeshoptEncoder.ready;

async function convert(source) {
  const t0 = Date.now();
  const buf = fs.readFileSync(path.resolve(ROOT, source.file));
  const root = new FBXLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '');
  root.updateMatrixWorld(true);

  // Z-up (Revit / 3ds Max) → Y-up: (x, y, z) → (x, z, -y)
  const zUp = new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1);

  /** One record per mesh, in world space. */
  const parts = [];
  const tmp = new THREE.Vector3();
  const m = new THREE.Matrix4();
  root.traverse((o) => {
    if (!o.isMesh || !o.geometry.attributes.position) return;
    const cls = classify(o.name);
    if (cls === 'drop') return;
    m.multiplyMatrices(zUp, o.matrixWorld);
    const g = o.geometry;
    const src = g.attributes.position;
    const index = g.index;
    const cornerCount = index ? index.count : src.count;
    if (cornerCount < 3) return;
    const corners = new Float32Array(cornerCount * 3);
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < cornerCount; i++) {
      tmp.fromBufferAttribute(src, index ? index.getX(i) : i).applyMatrix4(m);
      if (!Number.isFinite(tmp.x + tmp.y + tmp.z)) return;
      corners[i * 3] = tmp.x;
      corners[i * 3 + 1] = tmp.y;
      corners[i * 3 + 2] = tmp.z;
      if (tmp.x < min[0]) min[0] = tmp.x;
      if (tmp.y < min[1]) min[1] = tmp.y;
      if (tmp.z < min[2]) min[2] = tmp.z;
      if (tmp.x > max[0]) max[0] = tmp.x;
      if (tmp.y > max[1]) max[1] = tmp.y;
      if (tmp.z > max[2]) max[2] = tmp.z;
    }
    parts.push({ name: o.name, cls, corners, min, max, tris: cornerCount / 3 });
  });
  if (!parts.length) throw new Error('no geometry');
  const inTris = parts.reduce((s, p) => s + p.tris, 0);

  const isSite = (p) => p.cls === 'ground' || p.cls === 'water';
  const building = parts.filter((p) => !isSite(p));
  const basis = building.length ? building : parts;
  const centre = (p) => [(p.min[0] + p.max[0]) / 2, (p.min[1] + p.max[1]) / 2, (p.min[2] + p.max[2]) / 2];

  // Remove stray fragments far from the main body: compare each mesh centre with the median
  // centre and a generous percentile radius.
  const cx = percentile(basis.map((p) => centre(p)[0]), 0.5);
  const cz = percentile(basis.map((p) => centre(p)[2]), 0.5);
  const reach = Math.max(percentile(basis.map((p) => Math.hypot(centre(p)[0] - cx, centre(p)[2] - cz)), 0.9) * 2.2, 1e-6);
  const cys = basis.map((p) => centre(p)[1]);
  const yLo = percentile(cys, 0.01);
  const yHi = percentile(cys, 0.99);
  const ySlack = (yHi - yLo) * 1.5 + 1e-6;
  const dropped = [];
  const kept = parts.filter((p) => {
    const c = centre(p);
    const d = Math.hypot(c[0] - cx, c[2] - cz);
    const far = isSite(p) ? d > reach * 6 : d > reach;
    const offY = c[1] < yLo - ySlack || c[1] > yHi + ySlack;
    if (far || offY) {
      dropped.push(p.name);
      return false;
    }
    return true;
  });

  // Bounds of the kept building geometry (falls back to everything if there is none).
  const bMin = [Infinity, Infinity, Infinity];
  const bMax = [-Infinity, -Infinity, -Infinity];
  const measure = (list) => {
    for (const p of list) {
      for (let k = 0; k < 3; k++) {
        bMin[k] = Math.min(bMin[k], p.min[k]);
        bMax[k] = Math.max(bMax[k], p.max[k]);
      }
    }
  };
  measure(kept.filter((p) => !isSite(p)));
  if (!Number.isFinite(bMin[0])) measure(kept);
  const spanX = bMax[0] - bMin[0];
  const spanZ = bMax[2] - bMin[2];
  const span = Math.max(spanX, spanZ, (bMax[1] - bMin[1]) * 0.9, 1e-6);
  const scale = NORMALISED_SPAN / span;
  const ox = (bMin[0] + bMax[0]) / 2;
  const oz = (bMin[2] + bMax[2]) / 2;
  const oy = bMin[1];
  // The ground keeps only what lies within a disc around the building; the viewer fades its rim.
  const groundRadius = (Math.hypot(spanX, spanZ) / 2) * scale * 1.2 + 4;

  // Group by class, applying the normalising transform to every corner.
  const groups = new Map();
  for (const p of kept) {
    const arr = p.corners;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i] = (arr[i] - ox) * scale;
      arr[i + 1] = (arr[i + 1] - oy) * scale;
      arr[i + 2] = (arr[i + 2] - oz) * scale;
    }
    if (!groups.has(p.cls)) groups.set(p.cls, []);
    groups.get(p.cls).push(p);
  }

  const grid = NORMALISED_SPAN * 2e-5;
  const classMeshes = {};
  const classTrisIn = {};
  const buildingTris = [...groups.entries()].filter(([c]) => c !== 'ground' && c !== 'water').reduce((s, [, ps]) => s + ps.reduce((a, p) => a + p.tris, 0), 0);
  for (const [cls, ps] of groups) {
    let total = 0;
    for (const p of ps) total += p.corners.length;
    const all = new Float32Array(total);
    let off = 0;
    for (const p of ps) {
      all.set(p.corners, off);
      off += p.corners.length;
      p.corners = null; // free early
    }
    let mesh = buildIndexed(all, grid);
    classTrisIn[cls] = mesh.indices.length / 3;
    const target = cls === 'ground' || cls === 'water' ? GROUND_TRIS : Math.max(3000, (BUDGET_TRIS * classTrisIn[cls]) / Math.max(1, buildingTris));
    mesh = simplifyMesh(mesh, target);
    classMeshes[cls] = mesh;
  }

  // Trim the ground to the disc (triangle centroids outside are removed).
  if (classMeshes.ground) {
    const g = classMeshes.ground;
    const keepIdx = [];
    for (let t = 0; t < g.indices.length; t += 3) {
      let mx = 0;
      let mz = 0;
      for (let k = 0; k < 3; k++) {
        mx += g.positions[g.indices[t + k] * 3];
        mz += g.positions[g.indices[t + k] * 3 + 2];
      }
      if (Math.hypot(mx / 3, mz / 3) <= groundRadius) keepIdx.push(g.indices[t], g.indices[t + 1], g.indices[t + 2]);
    }
    if (keepIdx.length) classMeshes.ground = compact({ positions: g.positions, indices: Uint32Array.from(keepIdx) });
    else delete classMeshes.ground;
  }

  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene(source.id);
  const gNode = doc.createNode(source.id);
  scene.addChild(gNode);

  let outTris = 0;
  const edgeSets = [];
  const accessor = (type, array) => doc.createAccessor().setType(type).setArray(array).setBuffer(buffer);
  for (const [cls, mesh] of Object.entries(classMeshes)) {
    if (!mesh.indices.length) continue;
    const shaded = cls === 'ground' || cls === 'water' ? flatUp(mesh) : smoothNormals(mesh);
    const f = FINISH[cls];
    const mat = doc
      .createMaterial(cls)
      .setBaseColorFactor([f.color[0], f.color[1], f.color[2], cls === 'glass' ? 0.5 : cls === 'water' ? 0.8 : 1])
      .setRoughnessFactor(f.rough)
      .setMetallicFactor(f.metal)
      .setDoubleSided(true);
    if (cls === 'glass' || cls === 'water') mat.setAlphaMode('BLEND');
    const prim = doc
      .createPrimitive()
      .setMaterial(mat)
      .setAttribute('POSITION', accessor('VEC3', shaded.positions))
      .setAttribute('NORMAL', accessor('VEC3', shaded.normals))
      .setIndices(accessor('SCALAR', shaded.indices));
    gNode.addChild(doc.createNode(cls).setMesh(doc.createMesh(cls).addPrimitive(prim)));
    outTris += shaded.indices.length / 3;
    if (cls === 'stone' || cls === 'metal' || cls === 'wood') edgeSets.push(featureEdges(mesh, NORMALISED_SPAN * 0.0035, MAX_EDGES));
  }

  // Feature lines: every class's, longest first, capped.
  let edgeCount = 0;
  if (edgeSets.length) {
    const merged = new Float32Array(edgeSets.reduce((s, e) => s + e.length, 0));
    let o = 0;
    for (const e of edgeSets) {
      merged.set(e, o);
      o += e.length;
    }
    const segs = merged.length / 6;
    const lens = new Float32Array(segs);
    for (let i = 0; i < segs; i++) {
      lens[i] = Math.hypot(merged[i * 6] - merged[i * 6 + 3], merged[i * 6 + 1] - merged[i * 6 + 4], merged[i * 6 + 2] - merged[i * 6 + 5]);
    }
    const order = Array.from({ length: segs }, (_, i) => i).sort((a, b) => lens[b] - lens[a]).slice(0, MAX_EDGES);
    const lines = new Float32Array(order.length * 6);
    order.forEach((s, i) => lines.set(merged.subarray(s * 6, s * 6 + 6), i * 6));
    edgeCount = order.length;
    if (edgeCount) {
      const lineMat = doc.createMaterial('edges').setBaseColorFactor([0.3, 0.72, 0.96, 1]);
      const linePrim = doc
        .createPrimitive()
        .setMode(1) // LINES
        .setMaterial(lineMat)
        .setAttribute('POSITION', accessor('VEC3', lines));
      gNode.addChild(doc.createNode('Edges').setMesh(doc.createMesh('Edges').addPrimitive(linePrim)));
    }
  }

  await doc.transform(
    dedup(),
    prune(),
    reorder({ encoder: MeshoptEncoder, target: 'size' }),
    quantize({ quantizePosition: 14, quantizeNormal: 8 }),
    meshopt({ encoder: MeshoptEncoder, level: 'high' })
  );

  const outDir = source.outDir ? path.resolve(ROOT, source.outDir) : OUT_DIR;
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${source.id}.glb`);
  const io = new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
  await io.write(outFile, doc);
  const bytes = fs.statSync(outFile).size;

  const info = {
    id: source.id,
    label: source.label,
    bytes,
    triangles: outTris,
    sourceTriangles: Math.round(inTris),
    edges: edgeCount,
    // Normalised units (longest side = 100)
    height: Math.round((bMax[1] - bMin[1]) * scale * 10) / 10,
    footprint: [Math.round(spanX * scale * 10) / 10, Math.round(spanZ * scale * 10) / 10],
    groundRadius: Math.round(groundRadius * 10) / 10,
    classes: classTrisIn,
    dropped: dropped.length,
    seconds: Math.round((Date.now() - t0) / 100) / 10,
  };
  console.log(
    `${source.id.padEnd(30)} ${(bytes / 1048576).toFixed(2).padStart(6)} MB  ${String(Math.round(outTris / 1000)).padStart(4)}k tris (src ${String(Math.round(inTris / 1000)).padStart(5)}k)  edges ${String(edgeCount).padStart(6)}  h=${String(info.height).padStart(5)}  dropped=${dropped.length}  ${info.seconds}s`
  );
  return info;
}

export { convert as convertFbx };

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  // Single-file mode (admin upload)
  if (arg('file')) {
    const info = await convert({ id: arg('id'), label: arg('label') || arg('id'), file: arg('file'), outDir: arg('out') });
    console.log('RESULT ' + JSON.stringify(info));
    return;
  }

  const only = process.argv.slice(2);
  const todo = SOURCES.filter((s) => only.length === 0 || only.includes(s.id));
  if (!todo.length) {
    console.error('No matching model ids. Known:', SOURCES.map((s) => s.id).join(', '));
    process.exit(1);
  }

  let report = {};
  try {
    report = JSON.parse(fs.readFileSync(REPORT, 'utf8'));
  } catch {
    /* first run */
  }
  for (const s of todo) {
    try {
      report[s.id] = await convert(s);
    } catch (e) {
      console.error(`FAILED ${s.id}:`, e.stack || e.message);
    }
  }
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2) + '\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e.stack || e.message);
    process.exit(1);
  });
}

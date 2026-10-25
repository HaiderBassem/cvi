import React from 'react';

/* ------------------------------------------------------------------------------------------
 * A right hand holding a pencil in a tripod grip, drawn as organic shapes (not capsules):
 * tapered fingers with joints, creases and nails, a back of the hand with knuckles and
 * tendons, a wrist, a forearm, a shirt cuff, soft skin shading and a cast shadow.
 *
 * Drawn upright in its own space: the pencil tip is the origin and the pencil points up
 * (negative y); the whole group is then tilted so the pencil leans like a writing hand.
 * ---------------------------------------------------------------------------------------- */

type P = readonly [number, number];
type Bez = readonly [P, P, P, P];

const SKIN = { base: '#e9bd9b', light: '#f5d8c0', mid: '#dba884', shade: '#b97f5d', line: '#7d4c35', nail: '#f1cdbd', crease: '#a56c4b' };
const INK = '#1b1b1f';

const bez = (c: Bez, t: number): P => {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const d = 3 * u * t * t;
  const e = t * t * t;
  return [a * c[0][0] + b * c[1][0] + d * c[2][0] + e * c[3][0], a * c[0][1] + b * c[1][1] + d * c[2][1] + e * c[3][1]];
};

/** Unit tangent and left-hand normal of the centre line at t. */
const frame = (c: Bez, t: number) => {
  const u = 1 - t;
  const dx = 3 * u * u * (c[1][0] - c[0][0]) + 6 * u * t * (c[2][0] - c[1][0]) + 3 * t * t * (c[3][0] - c[2][0]);
  const dy = 3 * u * u * (c[1][1] - c[0][1]) + 6 * u * t * (c[2][1] - c[1][1]) + 3 * t * t * (c[3][1] - c[2][1]);
  const len = Math.hypot(dx, dy) || 1;
  const tx = dx / len;
  const ty = dy / len;
  return { tx, ty, nx: -ty, ny: tx };
};

/** Smooth closed or open curve through points (Catmull-Rom converted to cubic Béziers). */
const smooth = (pts: P[], closed = true): string => {
  const n = pts.length;
  const at = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.min(n - 1, Math.max(0, i))]);
  let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return closed ? d + 'Z' : d;
};

interface FingerSpec {
  c: Bez;
  /** Width at the knuckle and at the tip. */
  w0: number;
  w1: number;
}

/** Width along the finger: tapers, with a slight swell at each joint. */
const widthAt = (f: FingerSpec, t: number) => {
  const taper = f.w0 + (f.w1 - f.w0) * (1 - Math.pow(1 - t, 1.5));
  return taper * (1 + 0.045 * Math.sin(t * Math.PI * 3 - 0.4));
};

const point = (f: FingerSpec, t: number, lateral: number): P => {
  const [x, y] = bez(f.c, t);
  const { nx, ny } = frame(f.c, t);
  const off = lateral * widthAt(f, t);
  return [x + nx * off, y + ny * off];
};

/** Whole-finger silhouette: left edge, rounded tip, right edge. */
const fingerPath = (f: FingerSpec): string => {
  const pts: P[] = [];
  const N = 14;
  for (let i = 0; i <= N; i++) pts.push(point(f, i / N, 0.5));
  const tip = bez(f.c, 1);
  const { tx, ty, nx, ny } = frame(f.c, 1);
  const r = widthAt(f, 1) / 2;
  for (let i = 1; i < 6; i++) {
    const a = (i / 6) * Math.PI;
    // a flattened, slightly elliptical pad rather than a perfect semicircle
    pts.push([tip[0] + (nx * Math.cos(a) * r + tx * Math.sin(a) * r * 0.82), tip[1] + (ny * Math.cos(a) * r + ty * Math.sin(a) * r * 0.82)]);
  }
  for (let i = N; i >= 0; i--) pts.push(point(f, i / N, -0.5));
  return smooth(pts, true);
};

/** A strip along the finger between two lateral positions (fractions of the width, -0.5..0.5). */
const ribbon = (f: FingerSpec, t0: number, t1: number, a0: number, a1: number, n = 10): string => {
  const pts: P[] = [];
  for (let i = 0; i <= n; i++) pts.push(point(f, t0 + ((t1 - t0) * i) / n, a1));
  for (let i = n; i >= 0; i--) pts.push(point(f, t0 + ((t1 - t0) * i) / n, a0));
  return smooth(pts, true);
};

/** A fingernail: rounded rectangle sitting on the last part of the finger. */
const nailPath = (f: FingerSpec, t0 = 0.8, t1 = 0.965, half = 0.27, side = 0): string => {
  const pts: P[] = [];
  const n = 10;
  const prof = (u: number) => half * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(2 * u - 1), 5)), 0.5);
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    pts.push(point(f, t0 + (t1 - t0) * u, side + prof(u)));
  }
  for (let i = n; i >= 0; i--) {
    const u = i / n;
    pts.push(point(f, t0 + (t1 - t0) * u, side - prof(u)));
  }
  return smooth(pts, true);
};

/** A short curved skin crease across the finger at t. */
const crease = (f: FingerSpec, t: number, half = 0.3, bow = 1.6): string => {
  const a = point(f, t, -half);
  const b = point(f, t, half);
  const m = point(f, t + 0.012, 0);
  return `M${a[0].toFixed(1)} ${a[1].toFixed(1)}Q${(m[0] + (m[0] - (a[0] + b[0]) / 2) * bow).toFixed(1)} ${(m[1] + (m[1] - (a[1] + b[1]) / 2) * bow).toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
};

/* ---- the hand's geometry (page units, roughly 1.7 per millimetre) ---------------------------
 * Viewpoint: beside the writer's right shoulder, looking down across the forearm — the classic
 * "hand writing" view. So: the arm enters from the right, the pencil leans up-right, the index
 * finger arches over the shaft and presses it from above, the thumb is on the far side (only
 * its tip shows past the shaft), the middle finger carries the pencil from below, and the ring
 * and little fingers curl in and rest on the paper. The pencil tip is the origin.
 * ------------------------------------------------------------------------------------------- */

const PENCIL_TILT = 32; // degrees from vertical, leaning right
const ur: P = [Math.sin((PENCIL_TILT * Math.PI) / 180), -Math.cos((PENCIL_TILT * Math.PI) / 180)]; // along the shaft, tip → eraser
const nr: P = [-ur[1], ur[0]]; // across the shaft, toward the viewer (down-right)
/** A point s along the shaft and k across it. */
const on = (s: number, k: number): P => [s * ur[0] + k * nr[0], s * ur[1] + k * nr[1]];

// Finger roots start well inside the hand; the back of the hand is painted over them, so the
// knuckle ridge outlines each finger the way skin does.
const INDEX: FingerSpec = { c: [[124, -98], [64, -118], [43, -62], on(46, 6)], w0: 31, w1: 21 };
const MIDDLE: FingerSpec = { c: [[138, -66], [78, -78], [40, -52], on(36, 12)], w0: 31, w1: 22 };
const RING: FingerSpec = { c: [[152, -36], [116, -52], [92, -42], [90, -18]], w0: 28, w1: 23 };
const PINKY: FingerSpec = { c: [[162, -10], [136, -24], [112, -16], [110, 2]], w0: 24, w1: 20 };
const THUMB: FingerSpec = { c: [[118, -52], [78, -74], [46, -84], on(60, -11)], w0: 40, w1: 27 };

const BACK = smooth(
  [
    [98, -110], // index knuckle, the top-left corner of the hand
    [112, -118],
    [150, -124],
    [184, -122],
    [214, -110], // wrist, far edge
    [230, -66],
    [238, -22], // wrist, near edge
    [200, 4], // heel of the hand on the paper
    [168, 2],
    [152, -10], // little-finger knuckle
    [144, -26],
    [140, -38], // ring knuckle
    [128, -56],
    [124, -70], // middle knuckle
    [110, -88],
  ],
  true,
);
const FOREARM = 'M212 -108 C290 -98 370 -80 450 -56 L424 40 C350 20 280 0 236 -22 Z';
const CUFF = 'M442 -58 C452 -55 462 -52 476 -50 L450 47 C440 45 432 43 422 41 Z';
const SLEEVE = 'M474 -50 C560 -24 640 0 720 36 L690 150 C610 118 530 86 448 48 Z';

const SILHOUETTE = [BACK, FOREARM, fingerPath(INDEX), fingerPath(MIDDLE), fingerPath(RING), fingerPath(PINKY), fingerPath(THUMB)];

const stroke = { stroke: SKIN.line, strokeWidth: 1.3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

function Digit({ f, lit = 1, nail = true, creases = true, nailAt = 0.8 }: { f: FingerSpec; lit?: 1 | -1; nail?: boolean; creases?: boolean; nailAt?: number }) {
  const hi = lit === 1 ? [0.0, 0.32] : [-0.32, 0.0];
  const lo = lit === 1 ? [-0.5, -0.24] : [0.24, 0.5];
  return (
    <g>
      <path d={fingerPath(f)} fill={SKIN.base} {...stroke} />
      {/* light along the top of the finger, shade along its underside */}
      <path d={ribbon(f, 0.04, 0.9, lo[0], lo[1])} fill={SKIN.shade} opacity={0.28} />
      <path d={ribbon(f, 0.04, 0.9, hi[0], hi[1])} fill={SKIN.light} opacity={0.6} />
      <path d={ribbon(f, 0.5, 0.88, hi[0] * 0.5, hi[1] * 0.5)} fill="#fff" opacity={0.18} />
      {creases && (
        <g fill="none" stroke={SKIN.crease} strokeWidth={1.1} strokeLinecap="round" opacity={0.55}>
          <path d={crease(f, 0.42, 0.26)} />
          <path d={crease(f, 0.45, 0.2)} opacity={0.6} />
          <path d={crease(f, 0.7, 0.24)} />
        </g>
      )}
      {nail && (
        <g>
          <path d={nailPath(f, nailAt, nailAt + 0.165)} fill={SKIN.nail} stroke={SKIN.line} strokeWidth={1} strokeOpacity={0.75} />
          <path d={nailPath(f, nailAt + 0.03, nailAt + 0.12, 0.1, lit * -0.09)} fill="#fff" opacity={0.4} />
        </g>
      )}
    </g>
  );
}

export function SketchHand() {
  const dx = 16;
  const dy = 9; // cast shadow falls down-right on the paper
  const pencilT = `translate(0 0) rotate(${PENCIL_TILT})`;

  return (
    <g fill="none">
      <defs>
        <filter id="cvi-hand-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id="cvi-hand-blur-tight" x="-50%" y="-100%" width="200%" height="300%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <linearGradient id="cvi-hand-forearm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SKIN.light} />
          <stop offset="0.45" stopColor={SKIN.base} />
          <stop offset="1" stopColor={SKIN.mid} />
        </linearGradient>
        <linearGradient id="cvi-hand-back" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={SKIN.light} />
          <stop offset="0.5" stopColor={SKIN.base} />
          <stop offset="1" stopColor={SKIN.mid} />
        </linearGradient>
        <linearGradient id="cvi-hand-sleeve" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a58ad" />
          <stop offset="1" stopColor="#233a78" />
        </linearGradient>
        <linearGradient id="cvi-hand-pencil" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3a58ad" />
          <stop offset="0.38" stopColor="#2c4690" />
          <stop offset="0.62" stopColor="#283f7d" />
          <stop offset="1" stopColor="#1b2d5e" />
        </linearGradient>
      </defs>

      {/* soft cast shadow on the paper */}
      <g fill="#3a2a18" stroke="none" filter="url(#cvi-hand-blur)" opacity={0.22} transform={`translate(${dx} ${dy})`}>
        {SILHOUETTE.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      {/* darker contact shadow right under the parts that touch the paper */}
      <g fill="#3a2a18" stroke="none" filter="url(#cvi-hand-blur-tight)" opacity={0.18}>
        <ellipse cx="112" cy="14" rx="20" ry="5" />
        <ellipse cx="190" cy="10" rx="36" ry="6" />
      </g>

      {/* thumb — on the far side of the pencil, only its tip shows past the shaft */}
      <Digit f={THUMB} lit={-1} creases={false} nailAt={0.78} />

      {/* middle finger — carries the pencil from below */}
      <Digit f={MIDDLE} lit={1} nailAt={0.8} />

      {/* ring and little fingers, curled into the palm and resting on the paper */}
      <Digit f={RING} lit={1} creases={false} nail={false} />
      <path d={crease(RING, 0.5, 0.3)} stroke={SKIN.crease} strokeWidth={1.1} strokeLinecap="round" opacity={0.5} />
      <path d={ribbon(RING, 0.05, 0.5, -0.5, -0.1)} fill="#000" opacity={0.1} />
      <Digit f={PINKY} lit={1} creases={false} nail={false} />
      <path d={crease(PINKY, 0.5, 0.3)} stroke={SKIN.crease} strokeWidth={1.1} strokeLinecap="round" opacity={0.5} />

      {/* forearm, shirt cuff and sleeve */}
      <path d={FOREARM} fill="url(#cvi-hand-forearm)" {...stroke} />
      <path d="M224 -88 C240 -72 246 -50 244 -28" stroke={SKIN.crease} strokeWidth={1.2} opacity={0.35} strokeLinecap="round" />
      <path d={SLEEVE} fill="url(#cvi-hand-sleeve)" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M500 -36 C570 -14 640 10 700 36 M490 10 C560 34 630 58 690 86 M476 54 C540 80 600 104 660 128" stroke="#fff" strokeOpacity={0.14} strokeWidth={2.2} strokeLinecap="round" />
      <path d="M540 -30 C530 10 518 50 506 90" stroke="#10204a" strokeOpacity={0.35} strokeWidth={2} />
      <path d={CUFF} fill="#e9e4d6" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M460 -54 C450 -20 442 10 436 44" stroke={INK} strokeOpacity={0.18} strokeWidth={1.4} />
      <path d="M442 -58 C452 -55 462 -52 476 -50 L470 -28 C456 -30 446 -33 436 -36 Z" fill="#000" opacity={0.08} />

      {/* pencil */}
      <g transform={pencilT}>
        <path d="M0 0 L-7 -26 Q0 -28.7 7 -26 Z" fill="#e8cfa0" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
        <path d="M-3 -13 Q0 -14.2 3 -13 L7 -26 Q0 -28.7 -7 -26 Z" fill="#c9a96d" opacity={0.5} />
        <path d="M0 0 L-2.2 -8.5 Q0 -9.6 2.2 -8.5 Z" fill={INK} />
        <rect x="-7" y="-276" width="14" height="250" fill="url(#cvi-hand-pencil)" stroke={INK} strokeWidth={1.4} />
        <path d="M-2.2 -26 V-276 M2.4 -26 V-276" stroke="#fff" strokeOpacity={0.22} strokeWidth={0.9} />
        <rect x="-5.4" y="-272" width="1.8" height="242" fill="#fff" fillOpacity={0.2} />
        <rect x="-7.4" y="-292" width="14.8" height="16" fill="#cfcabd" stroke={INK} strokeWidth={1.4} />
        <path d="M-7.4 -286 H7.4 M-7.4 -281.5 H7.4" stroke={INK} strokeOpacity={0.5} strokeWidth={0.9} />
        <path d="M-7 -292 V-302 Q-7 -309 0 -309 Q7 -309 7 -302 V-292 Z" fill="#b85d38" stroke={INK} strokeWidth={1.4} />
        <path d="M-3.4 -293 V-301" stroke="#fff" strokeOpacity={0.3} strokeWidth={1.6} strokeLinecap="round" />
      </g>
      {/* the shaft's shadow on the fingers that hold it */}
      <path d={`M${on(26, 9)[0].toFixed(1)} ${on(26, 9)[1].toFixed(1)} L${on(60, 9)[0].toFixed(1)} ${on(60, 9)[1].toFixed(1)}`} stroke="#000" strokeOpacity={0.12} strokeWidth={6} strokeLinecap="round" />

      {/* index finger, arched over the shaft and pressing it from above */}
      <Digit f={INDEX} lit={1} nailAt={0.8} />

      {/* back of the hand, tilted onto its edge, painted over every finger root */}
      <path d={BACK} fill="url(#cvi-hand-back)" {...stroke} />
      <g fill="none" strokeLinecap="round">
        {/* extensor tendons fanning from the wrist to the knuckles */}
        <path d="M208 -98 C178 -108 142 -112 110 -104" stroke={SKIN.shade} strokeWidth={2.4} opacity={0.22} />
        <path d="M212 -82 C182 -86 152 -82 128 -68" stroke={SKIN.shade} strokeWidth={2.4} opacity={0.22} />
        <path d="M216 -66 C188 -66 162 -58 142 -40" stroke={SKIN.shade} strokeWidth={2.2} opacity={0.2} />
        <path d="M222 -50 C198 -46 172 -34 154 -14" stroke={SKIN.shade} strokeWidth={2.2} opacity={0.18} />
        {/* faint veins */}
        <path d="M202 -106 C182 -94 166 -94 152 -100 M210 -72 C192 -60 178 -58 162 -62" stroke="#7d86a8" strokeWidth={1.8} opacity={0.18} />
        {/* heel of the hand pressing the paper */}
        <path d="M168 2 C180 7 192 7 204 2" stroke={SKIN.shade} strokeWidth={3} opacity={0.22} />
        {/* shadow the hand throws onto the curled fingers below it */}
        <path d="M150 -12 C146 -22 142 -30 140 -38" stroke="#000" strokeOpacity={0.1} strokeWidth={8} />
      </g>
      {/* knuckles: a bright crown on each with shade behind */}
      <g stroke="none">
        {[
          [104, -106, 12, 9],
          [126, -72, 11, 8.5],
          [142, -40, 10, 8],
          [154, -12, 9, 7],
        ].map(([x, y, rx, ry], i) => (
          <g key={i}>
            <ellipse cx={x + 6} cy={y + 5} rx={rx + 3} ry={ry + 2} fill={SKIN.shade} opacity={0.18} />
            <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={SKIN.light} opacity={0.6} />
          </g>
        ))}
      </g>
    </g>
  );
}

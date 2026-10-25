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

/* ---- the hand's geometry (units: roughly 1.7 per millimetre; pencil is 12 wide) --------- */

const INDEX: FingerSpec = { c: [[138, -172], [102, -180], [50, -148], [5, -104]], w0: 34, w1: 24 };
const MIDDLE: FingerSpec = { c: [[148, -140], [110, -136], [54, -102], [8, -58]], w0: 35, w1: 25 };
const RING: FingerSpec = { c: [[156, -108], [118, -114], [82, -94], [86, -58]], w0: 32, w1: 23 };
const PINKY: FingerSpec = { c: [[162, -78], [130, -82], [102, -66], [106, -40]], w0: 27, w1: 20 };
const THUMB: FingerSpec = { c: [[212, -46], [150, -28], [70, -38], [-16, -76]], w0: 44, w1: 30 };

const BACK =
  'M118 -190 C180 -214 270 -218 350 -200 C356 -170 356 -120 350 -92 C330 -62 296 -34 250 -30 C214 -28 178 -40 168 -62 C150 -95 120 -150 118 -190 Z';
const FOREARM = 'M338 -198 C420 -206 500 -214 640 -232 L640 12 C500 -8 420 -22 340 -84 Z';
const CUFF = 'M418 -210 C446 -214 470 -217 494 -220 L504 -2 C478 -8 452 -13 426 -20 Z';
const SLEEVE = 'M494 -220 C560 -226 610 -232 700 -244 L700 28 C610 8 560 0 504 -2 Z';

const SILHOUETTE = [BACK, FOREARM, fingerPath(INDEX), fingerPath(MIDDLE), fingerPath(RING), fingerPath(PINKY), fingerPath(THUMB)];

const stroke = { stroke: SKIN.line, strokeWidth: 1.3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

function Digit({ f, lit = 1, nail = true, creases = true }: { f: FingerSpec; lit?: 1 | -1; nail?: boolean; creases?: boolean }) {
  const hi = lit === 1 ? [0.0, 0.32] : [-0.32, 0.0];
  const lo = lit === 1 ? [-0.5, -0.24] : [0.24, 0.5];
  return (
    <g>
      <path d={fingerPath(f)} fill={SKIN.base} {...stroke} />
      {/* light and shade along the finger */}
      <path d={ribbon(f, 0.04, 0.9, lo[0], lo[1])} fill={SKIN.shade} opacity={0.28} />
      <path d={ribbon(f, 0.04, 0.9, hi[0], hi[1])} fill={SKIN.light} opacity={0.6} />
      <path d={ribbon(f, 0.5, 0.88, hi[0] * 0.5, hi[1] * 0.5)} fill="#fff" opacity={0.18} />
      {creases && (
        <g fill="none" stroke={SKIN.crease} strokeWidth={1.1} strokeLinecap="round" opacity={0.55}>
          <path d={crease(f, 0.4, 0.26)} />
          <path d={crease(f, 0.43, 0.2)} opacity={0.6} />
          <path d={crease(f, 0.68, 0.24)} />
        </g>
      )}
      {nail && (
        <g>
          <path d={nailPath(f)} fill={SKIN.nail} stroke={SKIN.line} strokeWidth={1} strokeOpacity={0.75} />
          <path d={nailPath(f, 0.83, 0.92, 0.1, lit * -0.09)} fill="#fff" opacity={0.4} />
        </g>
      )}
    </g>
  );
}

export function SketchHand() {
  const dx = 14.8;
  const dy = 8.7; // cast shadow offset, expressed in the tilted frame so it falls down-right on the page

  return (
    <g transform="rotate(24)" fill="none">
      <defs>
        <linearGradient id="cvi-hand-forearm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SKIN.light} />
          <stop offset="0.45" stopColor={SKIN.base} />
          <stop offset="1" stopColor={SKIN.mid} />
        </linearGradient>
        <radialGradient id="cvi-hand-back" cx="0.42" cy="0.3" r="0.8">
          <stop offset="0" stopColor={SKIN.light} />
          <stop offset="0.55" stopColor={SKIN.base} />
          <stop offset="1" stopColor={SKIN.mid} />
        </radialGradient>
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

      {/* soft cast shadow on the paper: a few offset copies fake the blur without a filter */}
      <g fill="#3a2a18" stroke="none">
        {[
          [2.2, 0.035],
          [1.6, 0.05],
          [1.1, 0.07],
          [0.6, 0.08],
        ].map(([k, o]) => (
          <g key={k} transform={`translate(${dx * k} ${dy * k})`} opacity={o}>
            {SILHOUETTE.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        ))}
      </g>

      {/* forearm, shirt cuff and sleeve */}
      <path d={FOREARM} fill="url(#cvi-hand-forearm)" {...stroke} />
      <path d="M352 -190 C400 -194 410 -150 410 -110" stroke={SKIN.crease} strokeWidth={1.2} opacity={0.35} />
      <path d={SLEEVE} fill="url(#cvi-hand-sleeve)" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M520 -206 C560 -212 600 -216 690 -226 M512 -130 C560 -132 610 -134 696 -140 M510 -56 C560 -52 610 -46 696 -36" stroke="#fff" strokeOpacity={0.14} strokeWidth={2.2} strokeLinecap="round" />
      <path d="M540 -216 C548 -150 548 -80 538 -6" stroke="#10204a" strokeOpacity={0.35} strokeWidth={2} />
      <path d={CUFF} fill="#e9e4d6" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M440 -213 C448 -150 448 -80 438 -16" stroke={INK} strokeOpacity={0.18} strokeWidth={1.4} />
      <path d="M418 -210 C446 -214 470 -217 494 -220 L496 -190 C470 -188 444 -186 418 -182 Z" fill="#000" opacity={0.08} />

      {/* wrist bone */}
      <ellipse cx="338" cy="-94" rx="9" ry="6" fill={SKIN.light} opacity={0.5} transform="rotate(-20 338 -94)" />

      {/* thumb, drawn before the pencil so it tucks underneath */}
      <Digit f={THUMB} lit={-1} />

      {/* curled little and ring fingers */}
      <Digit f={PINKY} lit={-1} creases={false} />
      <Digit f={RING} lit={-1} creases={false} />

      {/* middle finger, supporting the pencil from below */}
      <Digit f={MIDDLE} lit={-1} />

      {/* back of the hand */}
      <path d={BACK} fill="url(#cvi-hand-back)" {...stroke} />
      <g fill="none" strokeLinecap="round">
        {/* extensor tendons running to the knuckles */}
        <path d="M196 -176 C230 -178 262 -184 322 -186" stroke={SKIN.shade} strokeWidth={2.4} opacity={0.2} />
        <path d="M176 -150 C226 -154 270 -162 330 -166" stroke={SKIN.shade} strokeWidth={2.4} opacity={0.22} />
        <path d="M168 -122 C222 -126 268 -134 332 -140" stroke={SKIN.shade} strokeWidth={2.4} opacity={0.22} />
        <path d="M168 -92 C214 -96 262 -106 330 -112" stroke={SKIN.shade} strokeWidth={2.2} opacity={0.2} />
        {/* faint veins */}
        <path d="M230 -168 C262 -150 286 -140 330 -146 M240 -108 C268 -120 290 -122 330 -122" stroke="#7d86a8" strokeWidth={1.8} opacity={0.2} />
      </g>
      {/* knuckles */}
      <g stroke="none">
        {[
          [148, -172],
          [158, -140],
          [166, -108],
          [172, -78],
        ].map(([x, y], i) => (
          <g key={i}>
            <ellipse cx={x + 6} cy={y + 4} rx="14" ry="11" fill={SKIN.shade} opacity={0.2} />
            <ellipse cx={x} cy={y} rx="12" ry="9.5" fill={SKIN.light} opacity={0.6} />
          </g>
        ))}
      </g>
      <path d="M244 -12 C204 -10 172 -36 164 -66" stroke={SKIN.shade} strokeWidth={5} opacity={0.2} strokeLinecap="round" />

      {/* pencil */}
      <g>
        <path d="M0 0 L-7 -26 Q0 -28.7 7 -26 Z" fill="#e8cfa0" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
        <path d="M-3 -13 Q0 -14.2 3 -13 L7 -26 Q0 -28.7 -7 -26 Z" fill="#c9a96d" opacity={0.5} />
        <path d="M0 0 L-2.2 -8.5 Q0 -9.6 2.2 -8.5 Z" fill={INK} />
        <rect x="-7" y="-262" width="14" height="236" fill="url(#cvi-hand-pencil)" stroke={INK} strokeWidth={1.4} />
        <path d="M-2.2 -26 V-262 M2.4 -26 V-262" stroke="#fff" strokeOpacity={0.22} strokeWidth={0.9} />
        <rect x="-5.4" y="-258" width="1.8" height="228" fill="#fff" fillOpacity={0.2} />
        <rect x="-7.4" y="-278" width="14.8" height="16" fill="#cfcabd" stroke={INK} strokeWidth={1.4} />
        <path d="M-7.4 -272 H7.4 M-7.4 -267.5 H7.4" stroke={INK} strokeOpacity={0.5} strokeWidth={0.9} />
        <path d="M-7 -278 V-288 Q-7 -295 0 -295 Q7 -295 7 -288 V-278 Z" fill="#b85d38" stroke={INK} strokeWidth={1.4} />
        <path d="M-3.4 -279 V-287" stroke="#fff" strokeOpacity={0.3} strokeWidth={1.6} strokeLinecap="round" />
      </g>

      {/* index finger, resting on the pencil */}
      <Digit f={INDEX} lit={1} />
      {/* pad shadow where finger and thumb press the wood */}
      <ellipse cx="2" cy="-86" rx="9" ry="5" fill="#000" opacity={0.08} transform="rotate(-20 2 -86)" />
    </g>
  );
}

import React from 'react';

/**
 * The five drawings of the process scroll. Each one is plain SVG in a 640 × 520 box.
 * Anything marked `data-stroke` is drawn line by line as the page scrolls (its `data-w` is the
 * relative time it takes), `data-fill` paths also fade their fill in once the outline is done, and
 * `data-fade` groups fade in at the end. With reduced motion nothing is animated and every
 * drawing simply shows finished.
 */

const INK = '#1b1b1f';
const BLUE = '#283f7d';
const CORAL = '#c8503f';

type Tone = 'ink' | 'blue' | 'faint' | 'hatch' | 'coral';

const TONES: Record<Tone, { stroke: string; width: number; opacity: number }> = {
  ink: { stroke: INK, width: 2.1, opacity: 1 },
  blue: { stroke: BLUE, width: 1.6, opacity: 1 },
  faint: { stroke: BLUE, width: 1, opacity: 0.38 },
  hatch: { stroke: INK, width: 1, opacity: 0.5 },
  coral: { stroke: CORAL, width: 2.2, opacity: 1 },
};

function S({ d, tone = 'ink', w = 1, fill }: { d: string; tone?: Tone; w?: number; fill?: string }) {
  const t = TONES[tone];
  return (
    <path
      data-stroke=""
      data-w={w}
      data-fill={fill ? '' : undefined}
      d={d}
      pathLength={1}
      stroke={t.stroke}
      strokeWidth={t.width}
      strokeOpacity={t.opacity}
      strokeDasharray="1 2"
      fill={fill ?? 'none'}
    />
  );
}

/** Handwritten label that fades in once the drawing is done. */
function Note({ x, y, children, rotate = 0, tone = 'blue', size = 22 }: { x: number; y: number; children: React.ReactNode; rotate?: number; tone?: 'blue' | 'coral' | 'grey'; size?: number }) {
  const fill = tone === 'coral' ? CORAL : tone === 'grey' ? '#6d675b' : BLUE;
  return (
    <text x={x} y={y} fill={fill} fontSize={size * 0.74} transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined} style={{ fontFamily: 'var(--font-arch), cursive', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {children}
    </text>
  );
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/** Small seeded generator so the "hand-drawn" wobble is the same on server and client. */
function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** A polyline whose segments bow slightly, like a line drawn freehand. */
function rough(pts: [number, number][], seed = 1, wobble = 2.4) {
  const r = rng(seed);
  return pts
    .map((p, i) => {
      if (i === 0) return `M${p[0]} ${p[1]}`;
      const a = pts[i - 1];
      const mx = (a[0] + p[0]) / 2 + (r() - 0.5) * wobble * 2;
      const my = (a[1] + p[1]) / 2 + (r() - 0.5) * wobble * 2;
      return `Q${mx.toFixed(1)} ${my.toFixed(1)} ${p[0]} ${p[1]}`;
    })
    .join(' ');
}

/* ------------------------------------------------------------------ 1 · Concept sketch */

function ConceptSketch() {
  const bays = range(5).map((i) => 130 + i * 78);
  return (
    <>
      <S tone="faint" w={1.2} d="M40 440 H600 M320 30 V480 M200 90 V460 M440 90 V460 M40 150 H600" />
      <S w={0.8} d={rough([[60, 440], [580, 440]], 3)} />
      <S w={1} d={rough([[110, 440], [110, 350], [530, 350], [530, 440]], 5)} />
      <S w={1} d={rough([[110, 440], [110, 350], [530, 350], [530, 440]], 11, 3.2)} tone="hatch" />
      <S w={1.3} d={rough([[240, 350], [240, 150], [400, 150], [400, 350]], 7)} />
      <S w={1.3} d={rough([[240, 350], [240, 150], [400, 150], [400, 350]], 13, 3.2)} tone="hatch" />
      <S w={0.8} d={rough([[255, 150], [255, 120], [385, 120], [385, 150]], 17)} />
      <S w={0.7} d="M275 120 A45 45 0 0 1 365 120 M320 75 V32 M310 32 H330" />
      <S w={1.1} d={[200, 250, 300].map((y, i) => rough([[240, y], [400, y]], 20 + i)).join(' ')} />
      <S w={1.4} d={bays.map((x) => `M${x} 440 V404 A28 28 0 0 1 ${x + 56} 404 V440`).join(' ')} />
      <S w={0.8} tone="hatch" d={range(40).map((i) => `M${72 + i * 13} 440 l-8 10`).join(' ')} />
      <g data-fade="">
        <Note x={338} y={58} rotate={-3}>axis</Note>
        <Note x={436} y={188} rotate={-4}>tower?</Note>
        <Note x={70} y={72} rotate={-3} tone="grey" size={24}>first idea</Note>
      </g>
    </>
  );
}

/* ------------------------------------------------------------------ 2 · Massing study */

const ISO_S = 36;
const iso = (x: number, y: number, z: number): [number, number] => [320 + (x - y) * 0.866 * ISO_S, 330 + (x + y) * 0.5 * ISO_S - z * ISO_S - 30];
const pt = (p: [number, number]) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;

function Box({ x, y, z, w, d, h }: { x: number; y: number; z: number; w: number; d: number; h: number }) {
  const top = `M${pt(iso(x, y, z + h))} L${pt(iso(x + w, y, z + h))} L${pt(iso(x + w, y + d, z + h))} L${pt(iso(x, y + d, z + h))} Z`;
  const right = `M${pt(iso(x + w, y, z))} L${pt(iso(x + w, y + d, z))} L${pt(iso(x + w, y + d, z + h))} L${pt(iso(x + w, y, z + h))} Z`;
  const front = `M${pt(iso(x, y + d, z))} L${pt(iso(x + w, y + d, z))} L${pt(iso(x + w, y + d, z + h))} L${pt(iso(x, y + d, z + h))} Z`;
  return (
    <>
      <S w={1} d={front} fill="#e7dcc4" />
      <S w={1} d={right} fill="#d9ccb0" />
      <S w={1} d={top} fill="#f3ecdc" />
    </>
  );
}

function MassingStudy() {
  // storey lines on the tower's two visible faces
  const floors = range(4).map((i) => 1.2 + 1.1 * (i + 1));
  const towerLines = floors
    .map((z) => `M${pt(iso(2, 4, z))} L${pt(iso(4.5, 4, z))} L${pt(iso(4.5, 1.5, z))}`)
    .join(' ');
  return (
    <>
      <S tone="faint" w={1} d={`M${pt(iso(-1, -1, 0))} L${pt(iso(8, -1, 0))} L${pt(iso(8, 6, 0))} L${pt(iso(-1, 6, 0))} Z`} />
      <Box x={0} y={0} z={0} w={7} d={5} h={1.2} />
      <Box x={0.4} y={3} z={1.2} w={1.6} d={1.4} h={1} />
      <Box x={2} y={1.5} z={1.2} w={2.5} d={2.5} h={5.5} />
      <Box x={5} y={0.6} z={1.2} w={1.6} d={2} h={2.2} />
      <S w={1.2} tone="hatch" d={towerLines} />
      <g data-fade="">
        <Note x={56} y={96} rotate={-4}>sun path</Note>
        <Note x={470} y={168} rotate={3}>+142.50</Note>
        <Note x={70} y={470} rotate={-2} tone="grey">massing 1 : 500</Note>
      </g>
      <S tone="coral" w={0.9} d="M70 108 Q150 60 262 70 M256 62 L264 70 L255 78" />
    </>
  );
}

/* ------------------------------------------------------------------ 3 · Floor plan */

function FloorPlan() {
  return (
    <>
      <S tone="blue" w={0.9} d="M100 62 H540 M100 54 V70 M540 54 V70 M95 67 L105 57 M535 67 L545 57" />
      <S w={2} d="M100 90 H540 V430 H100 Z" />
      <S w={1.6} d="M112 102 H528 V418 H112 Z" />
      <S w={1.4} d="M300 102 V170 M300 214 V300 M112 300 H200 M244 300 H300 M300 250 H380 M424 250 H528 M420 250 V340 M420 384 V418" />
      <S w={0.9} tone="hatch" d="M300 170 H344 A44 44 0 0 1 300 214 M200 300 V344 A44 44 0 0 0 244 300 M380 250 V294 A44 44 0 0 0 424 250 M420 340 H464 A44 44 0 0 1 420 384" />
      <S w={1} tone="hatch" d={range(10).map((i) => `M440 ${112 + i * 12} H520`).join(' ')} />
      <S w={0.9} d="M210 178 m-22 0 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0 M128 122 h80 v26 h-80 Z M140 345 h90 v52 h-90 Z M470 330 m-20 0 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0" />
      <S w={0.8} tone="hatch" d="M150 80 V90 M300 80 V90 M450 80 V90" />
      <g data-fade="">
        <Note x={140} y={226} rotate={-2}>living</Note>
        <Note x={340} y={160} rotate={-2}>kitchen</Note>
        <Note x={152} y={372} rotate={-2}>bed</Note>
        <Note x={448} y={402} rotate={-2}>court</Note>
        <Note x={436} y={146} rotate={-2} size={18}>stair</Note>
        <Note x={296} y={56} tone="blue" size={18}>14.60</Note>
      </g>
    </>
  );
}

/* ------------------------------------------------------------------ 4 · Technical markup */

function cloud(cx: number, cy: number, r: number, n = 12) {
  const pts = range(n + 1).map((i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });
  const chord = (2 * Math.PI * r) / n;
  return pts.map((p, i) => (i === 0 ? `M${p[0].toFixed(1)} ${p[1].toFixed(1)}` : `A${(chord * 0.62).toFixed(1)} ${(chord * 0.62).toFixed(1)} 0 0 1 ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)).join(' ');
}

function TechnicalMarkup() {
  const levels = [420, 340, 260, 180, 100];
  const cols = [190, 360, 530];
  const columns = cols
    .map((x) => range(4).map((k) => `M${x - 7} ${levels[k] - 0} V${levels[k + 1] + 10} M${x + 7} ${levels[k]} V${levels[k + 1] + 10}`).join(' '))
    .join(' ');
  return (
    <>
      <S w={1} d="M110 420 H590" />
      <S w={0.8} tone="hatch" d={range(36).map((i) => `M${112 + i * 13} 420 l-8 10`).join(' ')} />
      <S w={1.2} d={levels.slice(1).map((y) => `M130 ${y} H590 V${y + 10} H130 Z`).join(' ')} />
      <S w={1.1} d={columns} />
      <S tone="blue" w={1} d={`M92 420 V100 ${levels.map((y) => `M86 ${y} H98`).join(' ')}`} />
      <S tone="faint" w={1} d={`M92 420 H130 ${levels.slice(1).map((y) => `M92 ${y} H130`).join(' ')}`} />
      <S tone="blue" w={0.9} d="M190 456 H530 M190 450 V462 M360 450 V462 M530 450 V462" />
      <g data-fade="">
        {levels.map((y, i) => (
          <Note key={y} x={596} y={y + 4} size={15} tone="blue">
            {i === 0 ? '±0.00' : `+${(i * 4.2).toFixed(2)}`}
          </Note>
        ))}
        <Note x={254} y={482} size={16}>8.40</Note>
        <Note x={424} y={482} size={16}>8.40</Note>
      </g>
      <S tone="coral" w={1.3} d={cloud(530, 335, 36)} />
      <S tone="coral" w={0.9} d="M545 301 Q578 250 560 78 M551 90 L560 76 L568 91" />
      <g data-fade="">
        <Note x={392} y={64} tone="coral" rotate={-3} size={24}>check slab edge</Note>
      </g>
    </>
  );
}

/* ------------------------------------------------------------------ 5 · Facade */

function Facade() {
  const left = 100;
  const right = 540;
  const bottom = 450;
  const top = 98;
  const fins = range(23).map((k) => {
    const x = left + k * 20;
    const t = top + 46 * (0.5 + 0.5 * Math.sin(k * 0.55));
    return `M${x} ${bottom} V${t.toFixed(1)}`;
  });
  // small openings sit between the fins, in a staggered pattern
  const windows = range(7).flatMap((r) => range(22).filter((c) => (r + c) % 2 === 0).map((c) => `M${left + 4 + c * 20} ${bottom - 12 - r * 44} h12 v-24 h-12 Z`));
  return (
    <>
      <S w={0.8} d={`M60 ${bottom} H580`} />
      <S w={1.6} d={`M${left} ${bottom} V${top} H${right} V${bottom}`} />
      <S w={0.8} tone="hatch" d={range(7).map((k) => `M${left} ${bottom - 44 * (k + 1)} H${right}`).join(' ')} />
      <S w={1.5} d={fins.join(' ')} />
      <S w={1.2} tone="blue" d={windows.join(' ')} />
      <S w={1} d={`M270 ${bottom} V402 A50 50 0 0 1 370 402 V${bottom}`} />
      <S w={1} tone="hatch" d={range(30)
        .map((i) => ({ y: top + 20 + i * 11 }))
        .filter(({ y }) => y + 50 <= bottom - 10)
        .map(({ y }) => `M${right - 70} ${y + 50} L${right} ${y}`)
        .join(' ')} />
      <S tone="blue" w={0.8} d={`M572 ${bottom} V${top} M564 ${bottom} H580 M564 ${top} H580`} />
      <g data-fade="">
        <Note x={60} y={76} rotate={-3} tone="grey" size={24}>south facade</Note>
        <Note x={424} y={84} rotate={2}>fins 20 cm</Note>
      </g>
    </>
  );
}

export const FEATURE_ART: Array<() => React.JSX.Element> = [ConceptSketch, MassingStudy, FloorPlan, TechnicalMarkup, Facade];
export const FEATURE_ART_ALT = [
  'A freehand sketch of an arched podium and tower',
  'An isometric massing study of a podium, tower and pavilions',
  'A floor plan with walls, doors, stairs and room names',
  'A building section with dimensions and a red revision mark',
  'A facade elevation with vertical fins and windows',
];

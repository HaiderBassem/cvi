/**
 * A small single-stroke ("monoline") alphabet, used by the opening screen when the studio sets
 * its own letters in the admin (the real logo outlines only exist for C, V and I).
 * Each glyph is absolute M / L / C / Z commands in a 40 x 60 cell.
 */

const GLYPHS: Record<string, string> = {
  A: 'M2 60 L20 0 L38 60 M9 40 L31 40',
  B: 'M4 0 L4 60 M4 0 L24 0 C37 0 37 28 22 28 L4 28 M22 28 C39 28 39 60 22 60 L4 60',
  C: 'M36 12 C30 -2 6 -2 4 18 L4 42 C6 62 30 62 36 48',
  D: 'M4 0 L4 60 M4 0 L18 0 C44 0 44 60 18 60 L4 60',
  E: 'M36 0 L4 0 L4 60 L36 60 M4 30 L28 30',
  F: 'M36 0 L4 0 L4 60 M4 28 L28 28',
  G: 'M36 12 C30 -2 6 -2 4 18 L4 42 C6 62 34 62 36 44 L36 32 L22 32',
  H: 'M4 0 L4 60 M36 0 L36 60 M4 30 L36 30',
  I: 'M20 0 L20 60 M10 0 L30 0 M10 60 L30 60',
  J: 'M32 0 L32 44 C32 66 4 62 4 42',
  K: 'M4 0 L4 60 M36 0 L4 34 M14 25 L38 60',
  L: 'M4 0 L4 60 L36 60',
  M: 'M4 60 L4 0 L20 36 L36 0 L36 60',
  N: 'M4 60 L4 0 L36 60 L36 0',
  O: 'M20 0 C2 0 2 60 20 60 C38 60 38 0 20 0 Z',
  P: 'M4 60 L4 0 L22 0 C42 0 42 32 22 32 L4 32',
  Q: 'M20 0 C2 0 2 60 20 60 C38 60 38 0 20 0 Z M24 44 L38 62',
  R: 'M4 60 L4 0 L22 0 C42 0 42 32 22 32 L4 32 M20 32 L36 60',
  S: 'M34 10 C28 -2 6 0 6 14 C6 30 34 28 34 46 C34 62 10 62 4 50',
  T: 'M2 0 L38 0 M20 0 L20 60',
  U: 'M4 0 L4 42 C4 66 36 66 36 42 L36 0',
  V: 'M2 0 L20 60 L38 0',
  W: 'M2 0 L11 60 L20 20 L29 60 L38 0',
  X: 'M4 0 L36 60 M36 0 L4 60',
  Y: 'M2 0 L20 28 L38 0 M20 28 L20 60',
  Z: 'M4 0 L36 0 L4 60 L36 60',
  '0': 'M20 0 C4 0 4 60 20 60 C36 60 36 0 20 0 Z',
  '1': 'M10 14 L22 0 L22 60 M10 60 L34 60',
  '2': 'M6 14 C8 -2 34 -2 34 16 C34 34 6 44 4 60 L36 60',
  '3': 'M6 6 C16 -4 34 2 32 16 C30 28 14 28 14 28 C34 28 38 44 32 54 C24 66 8 62 4 52',
  '4': 'M30 60 L30 0 L2 44 L38 44',
  '5': 'M34 0 L8 0 L6 28 C20 22 38 30 36 46 C34 66 10 64 4 54',
  '6': 'M32 4 C14 -4 4 12 4 40 C4 70 38 66 36 44 C34 26 8 28 5 42',
  '7': 'M4 0 L36 0 L14 60',
  '8': 'M20 28 C4 24 6 0 20 0 C34 0 36 24 20 28 C2 32 0 60 20 60 C40 60 38 32 20 28',
  '9': 'M8 56 C26 64 36 48 36 20 C36 -10 2 -6 4 16 C6 34 32 32 35 18',
  '-': 'M6 30 L34 30',
  '.': 'M20 56 L20 58',
};

const ADVANCE = 56; // cell width + gap
const SPACE = 30;

/** Moves every x coordinate of an absolute M / L / C path by dx. */
function shift(d: string, dx: number): string {
  let i = 0;
  return d.replace(/-?\d+(?:\.\d+)?/g, (n) => {
    const v = Number(n) + (i % 2 === 0 ? dx : 0);
    i++;
    return String(Number(v.toFixed(2)));
  });
}

/** Lays text out as stroke paths. Unknown characters are skipped. */
export function layoutStrokeText(text: string): { paths: string[]; width: number; height: number } {
  const paths: string[] = [];
  let x = 0;
  for (const raw of Array.from(text.toUpperCase())) {
    if (raw === ' ') {
      x += SPACE;
      continue;
    }
    const g = GLYPHS[raw];
    if (!g) continue;
    // each glyph is drawn as one path so the pencil never jumps mid-letter
    paths.push(shift(g, x));
    x += ADVANCE;
  }
  return { paths, width: Math.max(0, x - (ADVANCE - 40)), height: 60 };
}

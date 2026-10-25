import React from 'react';

/* ------------------------------------------------------------------------------------------
 * A real hand holding a pencil, for the drawing scene.
 *
 * Photo: "Taking notes with a pencil" (Unsplash), CC0 / public domain, via Wikimedia Commons.
 * It was cut out from its background, flipped so the arm comes from above and the pencil
 * leans up-right, and the pencil tip was located exactly (it is the origin of this group).
 * The photo is cropped at the wrist, so a vector shirt cuff and sleeve cover that edge and the
 * pencil is continued, in matching colours, up to its eraser.
 *
 * Units are the photo's own pixels, scaled by PHOTO_SCALE so the hand suits the drawing.
 * ---------------------------------------------------------------------------------------- */

const W = 780; // cropped photo size
const H = 740;
const TIP_X = 720; // pencil tip, in the cropped photo (before flipping)
const TIP_Y = 701;
const PHOTO_SCALE = 0.36;

// Pencil axis in the flipped frame (tip at 0,0): measured from the photo, 39.4° from vertical.
const AX = 0.635;
const AY = -0.774;
const NX = -AY; // across the pencil, toward the lit (bright) face
const NY = AX;
const along = (s: number, k: number) => `${(s * AX + k * NX).toFixed(1)},${(s * AY + k * NY).toFixed(1)}`;

const INK = '#1b1b1f';

/** The pencil beyond the cropped edge: dark face, bright face, ferrule and eraser. */
function PencilContinuation() {
  const s0 = 868; // start inside the photo so the seam is hidden
  const s1 = 1700; // end of the wood
  const w0 = 75; // perpendicular width at the seam
  const w1 = 62; // width at the far end (perspective)
  const half = (s: number) => (w0 + ((w1 - w0) * (s - s0)) / (s1 - s0)) / 2;
  const poly = (k0: number, k1: number) =>
    `M${along(s0, k0 * half(s0))} L${along(s1, k0 * half(s1))} L${along(s1, k1 * half(s1))} L${along(s0, k1 * half(s0))} Z`;
  const ferrule0 = s1;
  const ferrule1 = s1 + 58;
  const eraser1 = ferrule1 + 70;
  const hw = half(s1);
  return (
    <g strokeLinejoin="round">
      {/* wood: dark face on the far side, bright face toward the viewer */}
      <path d={poly(-1, 0.1)} fill="#9c6002" />
      <path d={poly(0.1, 1)} fill="#fbb937" />
      <path d={poly(0.1, 0.22)} fill="#f1a514" />
      <path d={poly(0.42, 0.62)} fill="#fff" opacity={0.2} />
      {/* ferrule */}
      <path
        d={`M${along(ferrule0, -hw - 1)} L${along(ferrule1, -hw - 1)} L${along(ferrule1, hw + 1)} L${along(ferrule0, hw + 1)} Z`}
        fill="#cfcabd"
        stroke={INK}
        strokeOpacity={0.5}
        strokeWidth={2}
      />
      {[14, 26, 40].map((d) => (
        <path key={d} d={`M${along(ferrule0 + d, -hw)} L${along(ferrule0 + d, hw)}`} stroke={INK} strokeOpacity={0.35} strokeWidth={2} />
      ))}
      {/* eraser */}
      <path
        d={`M${along(ferrule1, -hw)} L${along(eraser1 - 18, -hw)} Q${along(eraser1 + 4, -hw)} ${along(eraser1 + 4, 0)} Q${along(eraser1 + 4, hw)} ${along(eraser1 - 18, hw)} L${along(ferrule1, hw)} Z`}
        fill="#c4604a"
        stroke={INK}
        strokeOpacity={0.45}
        strokeWidth={2}
      />
      <path d={`M${along(ferrule1 + 8, hw * 0.45)} L${along(eraser1 - 14, hw * 0.45)}`} stroke="#fff" strokeOpacity={0.35} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
}

/** Shirt cuff and sleeve over the cut wrist, running up and out of the drawing. */
function Sleeve() {
  return (
    <g strokeLinejoin="round">
      <defs>
        <linearGradient id="cvi-photo-sleeve" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2c4690" />
          <stop offset="0.5" stopColor="#3a58ad" />
          <stop offset="1" stopColor="#233a78" />
        </linearGradient>
      </defs>
      {/* sleeve */}
      <path d="M-34 -652 L556 -684 L760 -2200 L120 -2200 Z" fill="url(#cvi-photo-sleeve)" stroke={INK} strokeWidth={2.5} />
      <path d="M120 -700 L240 -1800 M300 -700 L440 -1800 M470 -690 L610 -1800" stroke="#fff" strokeOpacity={0.12} strokeWidth={6} strokeLinecap="round" />
      <path d="M530 -700 C540 -900 580 -1100 640 -1500" stroke="#10204a" strokeOpacity={0.3} strokeWidth={8} fill="none" />
      {/* cuff over the cut edge of the photo */}
      <path d="M-44 -640 L560 -672 L566 -770 L-40 -736 Z" fill="#e9e4d6" stroke={INK} strokeWidth={2.5} />
      <path d="M-44 -640 L560 -672 L561 -690 L-43 -658 Z" fill="#000" opacity={0.1} />
      <path d="M200 -648 L204 -750 M360 -657 L364 -758" stroke={INK} strokeOpacity={0.15} strokeWidth={3} />
    </g>
  );
}

export function SketchHandPhoto() {
  // flip horizontally and move the pencil tip to the origin
  const place = `translate(${-(W - TIP_X)} ${-TIP_Y}) translate(${W} 0) scale(-1 1)`;
  return (
    <g transform={`scale(${PHOTO_SCALE})`}>
      {/* soft shadow baked into an image: falls down-right on the paper */}
      <g transform={`translate(34 24) ${place}`} opacity={0.9}>
        <image href="/brand/hand-pencil-shadow.png" width={W} height={H} />
      </g>
      <g transform={place}>
        <image href="/brand/hand-pencil.png" width={W} height={H} />
      </g>
      <Sleeve />
      <PencilContinuation />
    </g>
  );
}

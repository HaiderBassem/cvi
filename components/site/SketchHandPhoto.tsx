import React from 'react';

/* ------------------------------------------------------------------------------------------
 * A real hand holding a blue pencil, for the drawing scene.
 *
 * Photo: "High angle shot of a person drawing on white paper with a blue pencil" by wirestock,
 * free licence via Magnific/Freepik (attribution required — see the credit under the drawing
 * and public/brand/hand-pencil-SOURCE.txt). It was cut out from its white background, the
 * forearm was straightened, then lengthened and faded so it never shows a cut edge.
 *
 * The group's origin is the pencil tip, so the pen follows the line being drawn exactly.
 * ---------------------------------------------------------------------------------------- */

const W = 1380; // asset size in px
const H = 225;
const TIP_X = 30; // pencil tip inside the asset
const TIP_Y = 208;
const SCALE = 1.0; // asset px → drawing units
const TILT = 16; // degrees counter-clockwise: lifts the forearm up to the right, so it never covers finished work

interface SketchHandPhotoProps {
  /** Asset pixels → drawing units. The drawing scene uses 1; the opening screen draws in logo units, so it uses far less. */
  scale?: number;
  /** Degrees counter-clockwise; lifts the forearm up to the right. */
  tilt?: number;
  /** Where the shadow falls, in drawing units. */
  shadow?: [number, number];
}

export function SketchHandPhoto({ scale = SCALE, tilt = TILT, shadow = [9, 7] }: SketchHandPhotoProps = {}) {
  const place = `rotate(${-tilt}) scale(${scale}) translate(${-TIP_X} ${-TIP_Y})`;
  return (
    <g>
      {/* soft shadow baked into an image; it falls down-right on the paper */}
      <g transform={`translate(${shadow[0]} ${shadow[1]})`} opacity={0.95}>
        <g transform={place}>
          <image href="/brand/hand-pencil-shadow.png" width={W} height={H} />
        </g>
      </g>
      <g transform={place}>
        <image href="/brand/hand-pencil.png" width={W} height={H} />
      </g>
    </g>
  );
}

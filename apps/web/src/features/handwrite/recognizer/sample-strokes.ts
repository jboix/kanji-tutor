/**
 * Hand-made drawings for tests, in canvas pixels of a 342×300 drawing area, sampled every few
 * pixels the way pointer events arrive. 待 is the drawing in the handwriting mockup.
 */
import type { Pattern, Point, Stroke } from './geometry.ts';

type Path = readonly (readonly [number, number])[];

const STEP = 4;

/** Points every few pixels along a polyline. */
export function polyline(path: Path): Stroke {
  const out: Point[] = [];
  for (let i = 0; i + 1 < path.length; i++) {
    const [x0, y0] = path[i] as Point;
    const [x1, y1] = path[i + 1] as Point;
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / STEP));
    for (let k = 0; k < n; k++) out.push([x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n]);
  }
  out.push(path.at(-1) as Point);
  return out;
}

/** A quadratic Bézier from `a` through control `c` to `b`, as an SVG `Q` draws it. */
function quad(a: Point, c: Point, b: Point): Stroke {
  const out: Point[] = [];
  for (let k = 0; k <= 16; k++) {
    const t = k / 16;
    const u = 1 - t;
    out.push([
      u * u * a[0] + 2 * u * t * c[0] + t * t * b[0],
      u * u * a[1] + 2 * u * t * c[1] + t * t * b[1],
    ]);
  }
  return out;
}

const lines = (...paths: Path[]): Pattern => paths.map(polyline);

export const SAMPLES: Record<string, Pattern> = {
  一: lines([
    [70, 150],
    [270, 152],
  ]),
  二: lines(
    [
      [100, 100],
      [240, 100],
    ],
    [
      [70, 200],
      [270, 202],
    ],
  ),
  十: lines(
    [
      [70, 140],
      [270, 140],
    ],
    [
      [170, 50],
      [170, 250],
    ],
  ),
  口: lines(
    [
      [100, 80],
      [100, 230],
    ],
    [
      [100, 80],
      [240, 80],
      [240, 230],
    ],
    [
      [100, 225],
      [240, 225],
    ],
  ),
  人: lines(
    [
      [170, 50],
      [150, 150],
      [80, 250],
    ],
    [
      [160, 130],
      [210, 200],
      [260, 250],
    ],
  ),
  山: lines(
    [
      [170, 60],
      [170, 220],
    ],
    [
      [90, 110],
      [90, 220],
      [250, 220],
    ],
    [
      [250, 110],
      [250, 225],
    ],
  ),
  待: [
    quad([112, 58], [100, 78], [84, 96]),
    quad([116, 106], [98, 136], [76, 160]),
    polyline([
      [98, 142],
      [99, 252],
    ]),
    quad([148, 86], [200, 84], [248, 84]),
    polyline([
      [198, 48],
      [199, 126],
    ]),
    quad([138, 130], [205, 127], [262, 128]),
    quad([140, 174], [206, 171], [266, 172]),
    [
      ...polyline([
        [232, 146],
        [233, 244],
      ]),
      ...quad([233, 244], [228, 254], [212, 246]),
    ],
    quad([170, 202], [180, 214], [186, 226]),
  ],
};

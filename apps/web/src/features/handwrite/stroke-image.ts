/** The drawing as a PNG for the AI fallback (`recognizeHandwriting`): black ink on white. */
import type { Media } from '../../ai/types.ts';
import type { Stroke } from './recognizer/geometry.ts';

const SIZE = 256;
const MARGIN = 28;
const LINE = 10;

function frame(strokes: readonly Stroke[]) {
  const points = strokes.flat();
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const [x0, y0] = [Math.min(...xs), Math.min(...ys)];
  const span = Math.max(Math.max(...xs) - x0, Math.max(...ys) - y0, 1);
  const scale = (SIZE - 2 * MARGIN) / span;
  const dx = (SIZE - (Math.max(...xs) - x0) * scale) / 2;
  const dy = (SIZE - (Math.max(...ys) - y0) * scale) / 2;
  return (x: number, y: number): [number, number] => [(x - x0) * scale + dx, (y - y0) * scale + dy];
}

function draw(ctx: CanvasRenderingContext2D, strokes: readonly Stroke[]): void {
  const at = frame(strokes);
  Object.assign(ctx, { fillStyle: '#fff', strokeStyle: '#000', lineWidth: LINE });
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.fillRect(0, 0, SIZE, SIZE);
  for (const stroke of strokes) {
    ctx.beginPath();
    const [first, ...rest] = stroke;
    if (!first) continue;
    ctx.moveTo(...at(first[0], first[1]));
    // A lone tap still needs a segment for the round cap to draw a dot.
    for (const [x, y] of rest.length > 0 ? rest : [[first[0] + 0.5, first[1]] as const]) {
      ctx.lineTo(...at(x, y));
    }
    ctx.stroke();
  }
}

/** A centred 256×256 PNG of the strokes, or undefined when there is nothing to draw on. */
export function strokesToPng(strokes: readonly Stroke[]): Media | undefined {
  if (strokes.flat().length === 0) return undefined;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return undefined;
  draw(ctx, strokes);
  const data = canvas.toDataURL('image/png').split(',')[1];
  return data ? { mime: 'image/png', data } : undefined;
}

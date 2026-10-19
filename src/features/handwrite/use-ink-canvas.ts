import { type RefObject, useCallback, useEffect } from 'react';
import type { Stroke } from './recognizer/geometry.ts';

/** handwrite.html: ink strokes 8px with round caps and joins. */
const LINE_WIDTH = 8;

function sizeFor(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const dpr = window.devicePixelRatio || 1;
  const { width, height } = canvas.getBoundingClientRect();
  const w = Math.round(width * dpr);
  const h = Math.round(height * dpr);
  if (canvas.width !== w || canvas.height !== h) [canvas.width, canvas.height] = [w, h];
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  return ctx;
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
  const [first, ...rest] = stroke;
  if (!first) return;
  ctx.beginPath();
  if (rest.length === 0) {
    ctx.arc(first[0], first[1], LINE_WIDTH / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.moveTo(first[0], first[1]);
  for (const [x, y] of rest) ctx.lineTo(x, y);
  ctx.stroke();
}

/** Paints the strokes at device resolution in the canvas's CSS `color` (the ink token). */
export function paintInk(canvas: HTMLCanvasElement, strokes: readonly Stroke[]): void {
  const ctx = sizeFor(canvas);
  if (!ctx) return;
  const ink = getComputedStyle(canvas).color;
  Object.assign(ctx, { strokeStyle: ink, fillStyle: ink, lineWidth: LINE_WIDTH });
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const stroke of strokes) drawStroke(ctx, stroke);
}

/** Keeps the canvas painted with `strokes`, repainting when it is resized. */
export function useInkCanvas(ref: RefObject<HTMLCanvasElement | null>, strokes: readonly Stroke[]) {
  const paint = useCallback(() => {
    if (ref.current) paintInk(ref.current, strokes);
  }, [ref, strokes]);
  useEffect(paint, [paint]);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(paint);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [ref, paint]);
}

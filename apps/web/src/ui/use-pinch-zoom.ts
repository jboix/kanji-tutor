/**
 * Pinch to zoom a photo, drag to move it once zoomed, double-tap to zoom in or back out: the
 * transform for the image, and the pointer handlers for the area around it.
 */
import { type PointerEvent, useRef, useState } from 'react';

export interface Zoom {
  scale: number;
  x: number;
  y: number;
}

const FIT: Zoom = { scale: 1, x: 0, y: 0 };
const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.5;
const DOUBLE_TAP_MS = 300;
/** A tap moves less than this, in px. */
const TAP_SLOP = 10;

type Point = { x: number; y: number };

interface Gesture {
  pointers: Map<number, Point>;
  /** The zoom and pointers when the current gesture started. */
  from: Zoom;
  start: Point[];
  moved: boolean;
  lastTap: number;
}

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const middle = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const clampScale = (scale: number) => Math.min(MAX_SCALE, Math.max(1, scale));

/** The zoom a move makes: two fingers pinch and move, one drags a zoomed photo. */
function moved(gesture: Gesture, now: Point[]): Zoom {
  const { from, start } = gesture;
  const [a, b] = now;
  const [a0, b0] = start;
  if (a && b && a0 && b0) {
    const scale = clampScale((from.scale * distance(a, b)) / Math.max(1, distance(a0, b0)));
    const [m, m0] = [middle(a, b), middle(a0, b0)];
    return { scale, x: from.x + m.x - m0.x, y: from.y + m.y - m0.y };
  }
  if (!a || !a0 || from.scale === 1) return from;
  return { ...from, x: from.x + a.x - a0.x, y: from.y + a.y - a0.y };
}

/** The gesture starts again from here, with the pointers down now. */
function restart(gesture: Gesture, from: Zoom): void {
  gesture.from = from;
  gesture.start = [...gesture.pointers.values()];
}

function press(gesture: Gesture, id: number, at: Point, zoom: Zoom): void {
  gesture.pointers.set(id, at);
  gesture.moved = gesture.pointers.size > 1;
  restart(gesture, zoom);
}

/** The zoom after a pointer moved, or undefined for a pointer not down. */
function drag(gesture: Gesture, id: number, at: Point): Zoom | undefined {
  if (!gesture.pointers.has(id)) return undefined;
  gesture.pointers.set(id, at);
  const now = [...gesture.pointers.values()];
  if (now[0] && gesture.start[0] && distance(now[0], gesture.start[0]) > TAP_SLOP) {
    gesture.moved = true;
  }
  return moved(gesture, now);
}

/** A second tap soon after the first toggles the zoom; undefined for any other tap. */
function doubleTap(gesture: Gesture, zoom: Zoom, at: number): Zoom | undefined {
  const double = at - gesture.lastTap < DOUBLE_TAP_MS;
  gesture.lastTap = double ? 0 : at;
  if (!double) return undefined;
  return zoom.scale > 1 ? FIT : { ...FIT, scale: DOUBLE_TAP_SCALE };
}

/** Where lifting a pointer leaves the zoom: a photo back at fit is centred. */
function release(gesture: Gesture, id: number, zoom: Zoom, at: number): Zoom {
  gesture.pointers.delete(id);
  if (gesture.pointers.size > 0) return zoom;
  const toggled = gesture.moved ? undefined : doubleTap(gesture, zoom, at);
  return toggled ?? (zoom.scale <= 1 ? FIT : zoom);
}

const pointOf = (event: PointerEvent<HTMLElement>) => ({ x: event.clientX, y: event.clientY });

/** The photo's zoom and the handlers that change it. */
export function usePinchZoom() {
  const [zoom, setZoom] = useState<Zoom>(FIT);
  const gesture = useRef<Gesture>({
    pointers: new Map(),
    from: FIT,
    start: [],
    moved: false,
    lastTap: 0,
  });
  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    press(gesture.current, event.pointerId, pointOf(event), zoom);
  };
  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const next = drag(gesture.current, event.pointerId, pointOf(event));
    if (next) setZoom(next);
  };
  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    const next = release(gesture.current, event.pointerId, zoom, event.timeStamp);
    setZoom(next);
    restart(gesture.current, next);
  };
  const handlers = { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp };
  return { zoom, handlers };
}

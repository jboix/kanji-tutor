/** Photo preparation for OCR (C1): downscale to a sensible size, JPEG, base64. */
import type { Media } from '../../ai/types.ts';

/** Longest edge sent to the model: enough for printed handout text, a few hundred KB. */
export const MAX_EDGE = 1600;
export const JPEG_QUALITY = 0.8;

/** Size that fits within `maxEdge` on the long side, keeping the aspect ratio; never upscales. */
export function fitWithin(
  width: number,
  height: number,
  maxEdge = MAX_EDGE,
): { width: number; height: number } {
  const long = Math.max(width, height);
  if (long <= maxEdge || long === 0) return { width, height };
  const scale = maxEdge / long;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** Base64 of raw bytes, in chunks so large photos do not overflow the call stack. */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

/** A photo ready to store and to send: the downscaled JPEG and its base64 form. */
export interface PreparedImage {
  blob: Blob;
  media: Media;
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the photo.'))),
      'image/jpeg',
      JPEG_QUALITY,
    );
  });
}

/** Downscales a photo in a canvas (max {@link MAX_EDGE} px, JPEG {@link JPEG_QUALITY}). */
export async function prepareImage(file: Blob): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(file);
  const size = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, size.width, size.height);
  bitmap.close();
  const blob = await toBlob(canvas);
  const data = bytesToBase64(new Uint8Array(await blob.arrayBuffer()));
  return { blob, media: { mime: 'image/jpeg', data } };
}

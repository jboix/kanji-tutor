import { describe, expect, it } from 'vitest';
import type { ScannedLesson } from '../domain/scan-types.ts';
import { withFreshPhotos } from './fresh-photos.ts';

const lesson = (photo?: Blob) =>
  ({
    id: 's',
    pages: [{ kind: 'handout', lines: [], ...(photo ? { photo } : {}) }],
  }) as unknown as ScannedLesson;

describe('withFreshPhotos', () => {
  it('copies each page photo into a new blob with the same bytes and type', async () => {
    const photo = new Blob(['jpeg bytes'], { type: 'image/jpeg' });
    const copy = (await withFreshPhotos(lesson(photo))).pages[0]?.photo;
    expect(copy).not.toBe(photo);
    expect(copy?.type).toBe('image/jpeg');
    expect(await copy?.text()).toBe('jpeg bytes');
  });

  it('keeps a photo it cannot read, and a page without one', async () => {
    const broken = new Blob(['x']);
    broken.arrayBuffer = () => Promise.reject(new Error('WebKitBlobResource error 1'));
    expect((await withFreshPhotos(lesson(broken))).pages[0]?.photo).toBe(broken);
    expect((await withFreshPhotos(lesson())).pages[0]?.photo).toBeUndefined();
  });
});

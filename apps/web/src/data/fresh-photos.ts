/**
 * Safari can lose a photo read from IndexedDB when the record holding it is stored again as is:
 * the stored copy then points at data that is gone, and the page shows a broken image. So a
 * scanned lesson's photos go back in as fresh bytes, copied into memory first. A photo that is
 * already unreadable is stored as it was; nothing more can be done for it.
 */
import type { ScannedLesson } from '../domain/scan-types.ts';

async function fresh(photo: Blob): Promise<Blob> {
  try {
    return new Blob([await photo.arrayBuffer()], { type: photo.type });
  } catch {
    return photo;
  }
}

/** The lesson with each page photo as fresh bytes. */
export async function withFreshPhotos(lesson: ScannedLesson): Promise<ScannedLesson> {
  const pages = await Promise.all(
    lesson.pages.map(async (page) =>
      page.photo ? { ...page, photo: await fresh(page.photo) } : page,
    ),
  );
  return { ...lesson, pages };
}

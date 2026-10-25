/** Scanned lessons in and out of a backup file: page photos as data URLs, older captures converted. */
import type { ScannedLesson, ScanPage } from '../domain/scan-types.ts';
import { scanFromCapture } from '../domain/services/scans.ts';
import type { BackupFile } from './backup-schema.ts';

type BackupScan = BackupFile['data']['scans'][number];
type BackupPage = BackupScan['pages'][number];

export async function blobToDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  // Chunked: one String.fromCharCode call per 32 KB, so multi-MB photos stay fast.
  let binary = '';
  for (let at = 0; at < bytes.length; at += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(at, at + 0x8000));
  }
  return `data:${blob.type || 'application/octet-stream'};base64,${btoa(binary)}`;
}

export function dataUrlToBlob(url: string): Blob {
  const [head = '', body = ''] = url.split(',', 2);
  const type = head.slice(5).replace(';base64', '');
  const binary = atob(body);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new Blob([bytes], { type });
}

async function exportPage(page: ScanPage): Promise<BackupPage> {
  const { photo, ...rest } = page;
  return photo ? { ...rest, photo: await blobToDataUrl(photo) } : rest;
}

/** The lessons as a backup holds them. */
export function exportScans(scans: readonly ScannedLesson[]): Promise<BackupScan[]> {
  return Promise.all(
    scans.map(async (scan) => ({ ...scan, pages: await Promise.all(scan.pages.map(exportPage)) })),
  );
}

function importPage(page: BackupPage): ScanPage {
  const { photo, ...rest } = page;
  return photo ? { ...rest, photo: dataUrlToBlob(photo) } : rest;
}

/** The backup's lessons, then its older captures as lessons of one page (unless already one). */
export function importedScans(data: BackupFile['data']): ScannedLesson[] {
  const scans = data.scans.map((scan) => ({ ...scan, pages: scan.pages.map(importPage) }));
  const ids = new Set(scans.map((scan) => scan.id));
  const captures = (data.captures ?? [])
    .filter((capture) => !ids.has(capture.id))
    .map(({ photo, ...rest }) =>
      scanFromCapture(photo ? { ...rest, photo: dataUrlToBlob(photo) } : rest),
    );
  return [...scans, ...captures];
}

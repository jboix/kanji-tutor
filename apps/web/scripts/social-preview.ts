/**
 * `bun run social`: renders the GitHub social preview, `docs/social-preview.png`, at 1280 by 640.
 * The card is `social-preview/card.html`, with the app's fonts, its icon and a phone screen of the
 * tutor at work (`social-preview/screen.png`, taken from the mock build by
 * `tests/e2e/social-shot.spec.ts`), drawn by headless Chromium (Playwright's).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = resolve(import.meta.dir, '..');
const OUTPUT = join(ROOT, 'docs', 'social-preview.png');
const PAGE = join(ROOT, '.cache', 'social-preview.html');

const card = readFileSync(join(import.meta.dir, 'social-preview', 'card.html'), 'utf8')
  .replaceAll('{{fonts}}', pathToFileURL(join(ROOT, 'node_modules', '@fontsource')).href)
  .replace('{{icon}}', pathToFileURL(join(ROOT, 'public', 'icons', 'icon.svg')).href)
  .replace('{{screen}}', pathToFileURL(join(import.meta.dir, 'social-preview', 'screen.png')).href);
writeFileSync(PAGE, card);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 640 } });
await page.goto(pathToFileURL(PAGE).href);
await page.evaluate(() => document.fonts.ready);
await page.locator('.card').screenshot({ path: OUTPUT });
await browser.close();
console.log(`wrote ${OUTPUT}`);

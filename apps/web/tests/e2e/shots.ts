import { fileURLToPath } from 'node:url';
import { expect, type Locator, type Page, test } from '@playwright/test';

/**
 * Shared by the screenshot specs (`bun run screenshots`): each image goes to
 * `notes/screenshots/<area>-<state>.png` (notes/screenshots/README.md lists them). They run only
 * with SCREENSHOTS=1, at 390×844, against the mock-AI fixture-pack build.
 */
export const OUT = fileURLToPath(new URL('../../notes/screenshots/', import.meta.url));

export function onlyWithScreenshots() {
  test.skip(!process.env.SCREENSHOTS, 'run with bun run screenshots');
}

interface ShotOptions {
  /** The whole scrolling body instead of the 390×844 viewport. */
  full?: boolean;
  /** Scrolls this to the middle of the viewport first. */
  at?: Locator;
}

/** How much taller the tallest scrolling box (`main`, a wizard step) is than itself, in CSS px. */
function overflowOf(page: Page) {
  return page.evaluate(() =>
    Math.max(
      0,
      ...[...document.querySelectorAll<HTMLElement>('body *')]
        .filter((el) => ['auto', 'scroll'].includes(getComputedStyle(el).overflowY))
        .map((el) => el.scrollHeight - el.clientHeight),
    ),
  );
}

/**
 * Waits for fonts and the network, then saves the viewport. `full` grows the viewport by the
 * body's overflow first (the app scrolls inside `main`, so Playwright's fullPage sees nothing).
 */
export async function shot(page: Page, name: string, options: ShotOptions = {}) {
  await page.waitForLoadState('networkidle');
  // The launch screen (U12) must have left, or a cold page load shows it fading over the screen.
  await expect(page.locator('#launch')).toHaveCount(0, { timeout: 10_000 });
  await page.evaluate(() => document.fonts.ready);
  if (options.at) await options.at.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  // Let slides, lazy sections and the answer animations settle before measuring.
  await page.waitForTimeout(400);
  const size = page.viewportSize();
  const extra = options.full && size ? await overflowOf(page) : 0;
  if (size && extra > 0) {
    await page.setViewportSize({ ...size, height: size.height + extra });
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: `${OUT}${name}.png`, animations: 'disabled' });
  if (size && extra > 0) await page.setViewportSize(size);
}

/** The same screen in light, then dark (prefers-color-scheme), as `<name>-light` and `<name>-dark`. */
export async function shotBothThemes(page: Page, name: string, options: ShotOptions = {}) {
  await page.emulateMedia({ colorScheme: 'light' });
  await shot(page, `${name}-light`, options);
  await page.emulateMedia({ colorScheme: 'dark' });
  await shot(page, `${name}-dark`, options);
  await page.emulateMedia({ colorScheme: 'light' });
}

const DAY = 24 * 60 * 60 * 1000;
const TASKS = ['explainWord', 'explainMistake', 'explainSentence', 'memoryHook', 'followUp'];

/** One logged AI call `daysAgo` days back (an `AiLogEntry`). */
function logEntry(daysAgo: number, index: number, now: number) {
  const cached = index % 4 === 3;
  return {
    at: now - daysAgo * DAY - index * 60_000,
    task: TASKS[index % TASKS.length] ?? 'explainWord',
    model: index % 3 === 0 ? 'gemini-3.5-flash' : 'gemini-3.5-flash-lite',
    cached,
    inputTokens: cached ? 0 : 900 + ((index * 137) % 700),
    outputTokens: cached ? 0 : 180 + ((index * 59) % 240),
    cachedTokens: cached ? 0 : (index * 211) % 500,
    ok: index % 11 !== 5,
  };
}

/** Merges fields into the settings row (key 'app'), e.g. an opened unit for Today's line. */
export async function patchSettings(page: Page, patch: Record<string, unknown>) {
  await page.evaluate(async (fields) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open('kanji-reader');
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
    const tx = db.transaction('settings', 'readwrite');
    const get = tx.objectStore('settings').get('app');
    get.onsuccess = () => tx.objectStore('settings').put({ ...get.result, ...fields });
    await new Promise((resolve) => {
      tx.oncomplete = resolve;
    });
    db.close();
  }, patch);
}

/** Seeds about 30 days of AI use into the aiLog store, for the AI use charts (A16). */
export async function seedAiLog(page: Page) {
  const now = Date.now();
  const entries = Array.from({ length: 30 }, (_, day) => day).flatMap((day) =>
    Array.from({ length: (day * 7) % 5 }, (_, i) => logEntry(day, day * 5 + i, now)),
  );
  await page.evaluate(async (rows) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open('kanji-reader');
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
    const tx = db.transaction('aiLog', 'readwrite');
    for (const row of rows) tx.objectStore('aiLog').add(row);
    await new Promise((resolve) => {
      tx.oncomplete = resolve;
    });
    db.close();
  }, entries);
}

/** Answers the reading card's field with a guess and waits for the feedback. */
export async function typeAnswer(input: Locator, text: string) {
  await input.pressSequentially(text);
  await input.press('Enter');
  await expect(input.page().locator('[data-answer]').first()).toBeVisible();
}

import {
  type Browser,
  type BrowserContextOptions,
  expect,
  type Page,
  test,
} from '@playwright/test';
import { answerField, beginMix, importKnown, onboard } from './helpers.ts';

/**
 * Backup round trip (K7): export everything from Settings, start again on a device with no
 * data (a fresh browser context), import the file and find the words and history back.
 */

async function answerOneSentence(page: Page) {
  await beginMix(page);
  const input = await answerField(page);
  await input.pressSequentially('nu');
  await input.press('Enter');
  await expect(page.getByText('You wrote')).toBeVisible();
}

async function exportBackup(page: Page): Promise<string> {
  await page.goto('/settings/backup');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^kanji-tutor-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const path = test.info().outputPath(download.suggestedFilename());
  await download.saveAs(path);
  await expect(page.getByText(/^Last backup /)).toBeVisible();
  return path;
}

/** A new context: no IndexedDB, as on a wiped or new phone. */
async function freshPage(browser: Browser): Promise<Page> {
  const { baseURL, viewport, isMobile, hasTouch } = test.info().project.use;
  const options: BrowserContextOptions = {};
  if (baseURL !== undefined) options.baseURL = baseURL;
  if (viewport !== undefined) options.viewport = viewport;
  options.isMobile = isMobile ?? false;
  options.hasTouch = hasTouch ?? false;
  const context = await browser.newContext(options);
  return context.newPage();
}

async function expectKnownWords(page: Page, known: boolean) {
  await page.goto(`/kanji/${encodeURIComponent('紹')}`);
  await expect(page.getByRole('heading', { name: '紹' })).toBeVisible();
  await expect(page.getByText(/of your words?$/)).toHaveCount(known ? 1 : 0);
}

test('export a backup, wipe, import it and get the words and history back', async ({
  page,
  browser,
}) => {
  await onboard(page);
  await importKnown(page);
  await answerOneSentence(page);
  const file = await exportBackup(page);

  const wiped = await freshPage(browser);
  await onboard(wiped);
  await expect(wiped.getByRole('link', { name: 'Mark what you already know' })).toBeVisible();
  await expectKnownWords(wiped, false);

  await wiped.goto('/settings/backup');
  await wiped.locator('input[type="file"]').setInputFiles(file);
  await expect(wiped.getByText(/This replaces your reading history/)).toBeVisible();
  await wiped.getByRole('button', { name: 'Replace' }).click();
  await expect(wiped.getByRole('status').filter({ hasText: 'Backup restored.' })).toBeVisible();

  await wiped.goto('/');
  await expect(wiped.getByText(/sentences? (to read|and \d+ exercises?), about/)).toBeVisible();
  await expect(wiped.getByRole('link', { name: 'Mark what you already know' })).toHaveCount(0);
  // The one answer of the first device: read as ぬ, a miss.
  await expect(wiped.getByRole('region', { name: 'Where you are' })).toContainText('ぬ for');
  await expectKnownWords(wiped, true);
  await wiped.context().close();
});

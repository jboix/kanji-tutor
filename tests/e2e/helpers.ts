import { expect, type Locator, type Page } from '@playwright/test';

/** Blocks every request to Gemini: no e2e test may reach it (CLAUDE.md). */
export async function blockGemini(page: Page): Promise<void> {
  await page.context().route('**/generativelanguage.googleapis.com/**', (route) => route.abort());
}

/**
 * "Photograph a page" is an AI press (A18): it opens the picker with the client of that press, so
 * the photo goes through the button and its file chooser, never straight into the input.
 */
export async function photograph(
  page: Page,
  file: string,
  name = /^Photograph a page, 1 request, uses AI/,
) {
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name }).click();
  await (await chooser).setFiles(file);
}

/** The welcome wizard's current step title. */
export function stepHeading(page: Page, name: string) {
  return page.getByRole('heading', { level: 1, name });
}

/** Presses Next and waits for the step it leads to. */
export async function nextStep(page: Page, to: string): Promise<void> {
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(stepHeading(page, to)).toBeVisible();
}

/**
 * Goes through the welcome wizard quickly (P5): loads the fixture dictionary, starts from zero
 * (or at `start`, e.g. /I'm studying N4/), skips the optional steps and the key, and lands on
 * Today.
 */
export async function onboard(page: Page, start = /I'm starting from zero/): Promise<void> {
  await blockGemini(page);
  await page.goto('/');
  await expect(page).toHaveURL(/\/welcome$/);
  await expect(stepHeading(page, 'Welcome to Kanji Tutor')).toBeVisible();
  await nextStep(page, 'Your language');
  await nextStep(page, 'Load the dictionary');
  await page.getByRole('button', { name: 'Load dictionary' }).click();
  await nextStep(page, 'Where you start');
  await page.getByRole('radio', { name: start }).check();
  await nextStep(page, 'What you already know');
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect(stepHeading(page, 'Your class')).toBeVisible();
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect(stepHeading(page, 'Your AI tutor')).toBeVisible();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await expect(stepHeading(page, 'How sessions feel')).toBeVisible();
  await nextStep(page, 'Your choices');
  // Start reading opens once the dictionary is in.
  await page.getByRole('button', { name: 'Start reading' }).click({ timeout: 30_000 });
  await expect(page).toHaveURL(/\/$/, { timeout: 30_000 });
}

/**
 * The answer field of the next reading card, past the intros (L1, L8) and any question or drill
 * the mixer put first (V2, L6: short sessions bring exercises early): "Got it" on an intro, "I
 * don't know" and on past an exercise.
 */
export async function answerField(page: Page): Promise<Locator> {
  const input = page.locator('form input[lang="ja"]');
  const gotIt = page.getByRole('button', { name: 'Got it' });
  const dontKnow = page.getByRole('button', { name: "I don't know" });
  const onward = page.getByRole('button', { name: /^(Next (sentence|word|question)|Done)$/ });
  for (let step = 0; step < 10; step++) {
    await expect(input.or(gotIt).or(dontKnow).first()).toBeVisible({ timeout: 15_000 });
    if (await input.isVisible()) return input;
    if (await gotIt.isVisible()) await gotIt.click();
    else {
      await dontKnow.click();
      await onward.first().click();
    }
  }
  await expect(input).toBeVisible();
  return input;
}

/**
 * Marks the fixture's JLPT N5 and N4 words as known: from the first-run Today link, or from the
 * import page directly when the start already marked the N5 list (D38, D59) and Today has words.
 */
export async function importKnown(page: Page): Promise<void> {
  const link = page.getByRole('link', { name: 'Mark what you already know' });
  const firstRun = await link
    .waitFor({ timeout: 8_000 })
    .then(() => true)
    .catch(() => false);
  if (firstRun) await link.click();
  else await page.goto('/import');
  await expect(page).toHaveURL(/\/import$/);
  await page.getByRole('checkbox', { name: 'JLPT N4 (approximate list)' }).check();
  await page.getByRole('button', { name: 'Import' }).click();
  await expect(page.getByRole('status')).toContainText('words marked as known', {
    timeout: 20_000,
  });
  await page.getByRole('link', { name: 'Back to Home' }).click();
}

/** The 待 drawn in the handwriting mockup, as strokes in its 342×300 frame. */
export const MATSU: [number, number][][] = [
  [
    [112, 58],
    [100, 78],
    [84, 96],
  ],
  [
    [116, 106],
    [98, 136],
    [76, 160],
  ],
  [
    [98, 142],
    [99, 252],
  ],
  [
    [148, 86],
    [200, 84],
    [248, 84],
  ],
  [
    [198, 48],
    [199, 126],
  ],
  [
    [138, 130],
    [205, 127],
    [262, 128],
  ],
  [
    [140, 174],
    [206, 171],
    [266, 172],
  ],
  [
    [232, 146],
    [233, 244],
    [212, 246],
  ],
  [
    [170, 202],
    [186, 226],
  ],
];

/** Waits until the launch screen (U12) has faded and left the document. */
export async function launched(page: Page): Promise<void> {
  await expect(page.locator('#launch')).toHaveCount(0, { timeout: 10_000 });
}

export async function draw(page: Page, strokes = MATSU) {
  // Strokes drawn while the launch screen still covers the pad would be lost.
  await launched(page);
  const box = await page.getByRole('img', { name: /Drawing area/ }).boundingBox();
  if (!box) throw new Error('no drawing area');
  const at = ([x, y]: [number, number]) => [box.x + (x * box.width) / 342, box.y + y] as const;
  for (const [first, ...rest] of strokes) {
    if (!first) continue;
    await page.mouse.move(...at(first));
    await page.mouse.down();
    for (const point of rest) await page.mouse.move(...at(point), { steps: 8 });
    await page.mouse.up();
  }
}

/**
 * Starts the plain daily mix from Today (R1, N10, IA3). Start plays the next lesson part first
 * when one is due; "Just the daily mix" then skips it. Otherwise Start plays the mix.
 */
export async function beginMix(page: Page): Promise<void> {
  const settled = page.getByText(/^Press Start\.$|^Start plays the next lesson part first/);
  await expect(settled.first()).toBeVisible({ timeout: 20_000 });
  const mix = page.getByRole('link', { name: 'Just the daily mix' });
  if (await mix.isVisible()) await mix.click();
  else await page.getByRole('link', { name: 'Start the next round' }).click();
  await expect(page).toHaveURL(/\/read$/);
}

/** One Settings category (IA5), opened directly. */
export async function openSettings(page: Page, section: string): Promise<void> {
  await page.goto(`/settings/${section}`);
}

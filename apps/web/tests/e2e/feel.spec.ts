import { answerField, beginMix, importKnown, onboard } from './helpers.ts';
import { expect, type Page, test } from './test.ts';

const input = (page: Page) => page.locator('form input[lang="ja"]');
const sentence = (page: Page) => page.locator('main p[lang="ja"]').first();

async function begin(page: Page) {
  await onboard(page);
  await importKnown(page);
  await beginMix(page);
  await answerField(page);
}

async function answer(page: Page, text: string) {
  await answerField(page);
  await input(page).pressSequentially(text);
  await input(page).press('Enter');
}

/** Top and bottom of an element in CSS px, or a failure if it is not laid out. */
async function box(locator: ReturnType<Page['locator']>) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error('not laid out');
  return { top: rect.y, bottom: rect.y + rect.height };
}

test('the sentence and the input stay in view when the keyboard opens (U1)', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await begin(page);
  await input(page).focus();
  await expect(page.locator('html')).not.toHaveAttribute('data-keyboard', 'open');
  // A phone keyboard takes about 320px: the visual viewport shrinks to 420px.
  await page.setViewportSize({ width: 360, height: 420 });
  await expect(page.locator('html')).toHaveAttribute('data-keyboard', 'open');
  const text = await box(sentence(page));
  const field = await box(input(page));
  expect(text.top).toBeGreaterThanOrEqual(0);
  expect(text.bottom).toBeLessThanOrEqual(field.top);
  expect(field.bottom).toBeLessThanOrEqual(420);
  await expect(page.locator('main [data-target]')).toBeInViewport();
  const size = await sentence(page).evaluate((el) => getComputedStyle(el).fontSize);
  expect(size).toBe('22px');
  expect(await page.evaluate(() => window.scrollY)).toBe(0);

  await page.setViewportSize({ width: 360, height: 740 });
  await expect(page.locator('html')).not.toHaveAttribute('data-keyboard', 'open');
});

test('a miss shakes with the red pen; a right reading turns green (U2)', async ({ page }) => {
  await begin(page);
  await answer(page, 'nu');
  const wrong = page.locator('[data-answer="wrong"]');
  await expect(wrong).toBeVisible();
  await expect(wrong.getByRole('deletion')).toHaveText('ぬ');
  expect(await wrong.evaluate((el) => getComputedStyle(el).animationName)).not.toBe('none');

  await page.goto(
    `/read?kanji=${encodeURIComponent('紹')}&reading=${encodeURIComponent('ショウ')}`,
  );
  await answer(page, 'shoukai');
  const right = page.locator('[data-answer="correct"]');
  await expect(right).toBeVisible();
  await expect(right.locator('[data-check]')).toBeVisible();
  await expect(page.locator('main [data-target="correct"]')).toBeVisible();
  await expect(right).not.toContainText(/great|well done|nice/i);
});

test('reduced motion keeps the colour and drops the shake (U2)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await begin(page);
  await answer(page, 'nu');
  const wrong = page.locator('[data-answer="wrong"]');
  await expect(wrong).toBeVisible();
  expect(await wrong.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
});

test('"I don\'t know" shows the reading and moves on (L4)', async ({ page }) => {
  await begin(page);
  await page.getByRole('button', { name: "I don't know" }).click();
  const skipped = page.locator('[data-answer="skipped"]');
  await expect(skipped).toBeVisible();
  await expect(skipped).toContainText('Here it is:');
  await expect(skipped.getByRole('deletion')).toHaveCount(0);
  const next = page.getByRole('button', { name: /^Next (sentence|word)$/ });
  await next.click();
  await expect(skipped).toHaveCount(0);
  const intro = page.getByRole('button', { name: 'Got it' });
  const done = page.getByText('Session done');
  // The next card may be a question (V2): it has its own "I don't know".
  const exercise = page.getByRole('button', { name: "I don't know" });
  await expect(input(page).or(intro).or(done).or(exercise).first()).toBeVisible();
});

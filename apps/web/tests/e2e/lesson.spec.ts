import { onboard } from './helpers.ts';
import { card, passIntro, playSession, sessionDone } from './lesson-play.ts';
import { expect, type Page, test } from './test.ts';

/**
 * A unit lesson in textbook sections (S3): from zero, the first unit's 言葉, 文法, 練習, 読み物
 * and まとめ, each section's parts one session after another, the unit page showing where the
 * learner is, and Today's session mixing in exercise types (S7).
 */

const sections = (page: Page) => page.getByRole('region', { name: 'Sections' });
const next = (page: Page) => page.getByRole('link', { name: /^Next: / });

/** A lesson not begun opens with its conversation; Start goes on to its first part. */
async function startLesson(page: Page) {
  await expect(page.getByRole('heading', { name: 'First, the conversation' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Ask the tutor/ })).toBeInViewport();
  await page.getByRole('button', { name: 'Start: 言葉 · Words' }).click();
  await expect(
    page.getByRole('button', { name: /^Unit 1 · .+ · 言葉 · Words 1\/\d+, / }),
  ).toBeVisible();
}

test('close leaves the lesson after its next part, back to the unit', async ({ page }) => {
  test.setTimeout(120_000);
  await onboard(page);
  await page.goto('/units/i-am-a-student');
  await sections(page).getByRole('button').first().click();
  await startLesson(page);
  await playSession(page);
  await next(page).click();
  await expect(sessionDone(page)).toBeHidden();
  await page.getByRole('button', { name: 'End session' }).click();
  await expect(page).toHaveURL(/\/units\/i-am-a-student$/);
});

test('a unit lesson, section by section, then every section done', async ({ page }) => {
  test.setTimeout(300_000);
  await onboard(page);
  await page.goto('/units/i-am-a-student');
  const rows = sections(page).getByRole('button');
  await expect(rows).toHaveText([
    /^言葉 · Words/,
    /^文法 · Grammar/,
    /^練習 · Practice/,
    /^読み物 · Reading/,
    /^まとめ · Wrap-up/,
  ]);
  await expect(sections(page).locator('[aria-current="step"]')).toHaveAttribute(
    'data-section',
    'words',
  );
  await rows.first().click();
  await expect(page).toHaveURL(/\/read\?unit=i-am-a-student&section=words&part=1$/);
  await startLesson(page);

  const seen: string[] = [];
  const visited: string[] = [];
  for (let session = 0; session < 12; session++) {
    visited.push(new URL(page.url()).search);
    const types = await playSession(page);
    seen.push(...types);
    await expect(sessionDone(page)).toBeVisible();
    // The part is marked done first; then the next part, if any, is offered.
    const more = await next(page)
      .waitFor({ timeout: 5_000 })
      .then(() => true)
      .catch(() => false);
    if (!more) break;
    const href = (await next(page).getAttribute('href')) ?? '';
    await next(page).click();
    await expect(page).toHaveURL(href);
    await expect(sessionDone(page)).toBeHidden();
  }
  expect(visited.some((q) => q.includes('section=grammar'))).toBe(true);
  expect(visited.some((q) => q.includes('section=practice'))).toBe(true);
  expect(visited.some((q) => q.includes('section=reading'))).toBe(true);
  expect(visited.some((q) => q.includes('section=review'))).toBe(true);
  for (const type of ['reading', 'grammar-intro', 'drill:meaning', 'drill:pattern', 'passage']) {
    expect(seen, type).toContain(type);
  }

  await page.getByRole('link', { name: 'Back to the unit' }).click();
  await expect(page).toHaveURL(/\/units\/i-am-a-student$/);
  for (const row of await rows.all()) await expect(row).toContainText('Done');
});

test('a section resumes where it was left', async ({ page }) => {
  test.setTimeout(120_000);
  await onboard(page);
  await page.goto('/units/i-am-a-student');
  await sections(page).getByRole('button', { name: /^文法/ }).click();
  await expect(card(page)).toHaveAttribute('data-card', 'grammar-intro');
  await passIntro(page);
  const second = await card(page).getAttribute('data-card');
  await page.goto('/units/i-am-a-student');
  await sections(page).getByRole('button', { name: /^文法/ }).click();
  await expect(card(page)).toHaveAttribute('data-card', second ?? '');
});

test("Today's session mixes in exercise types from the first day", async ({ page }) => {
  test.setTimeout(120_000);
  await onboard(page);
  await page.goto('/read');
  const types = await playSession(page, 14);
  const s4 = types.filter((t) =>
    /^drill:(meaning|particle|pattern|conjugation|build|listening)$/.test(t),
  );
  expect(s4.length).toBeGreaterThan(0);
  expect(new Set(types).size).toBeGreaterThan(1);
});

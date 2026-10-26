import { importKnown, onboard } from './helpers.ts';
import { playSession } from './lesson-play.ts';
import { onlyWithScreenshots, seedAiLog, shot, shotBothThemes } from './shots.ts';
import { expect, type Page, test } from './test.ts';

/** Revision 2 pages without a mockup: units, grammar, learned, placement, settings (T, G, P, A). */
onlyWithScreenshots();

const sections = (page: Page) => page.getByRole('region', { name: 'Sections' });

test('units: the path, a unit lesson in sections and a part done', async ({ page }) => {
  test.setTimeout(120_000);
  await onboard(page);
  await page.goto('/units');
  await shot(page, 'units-path', { full: true });
  await page.goto('/units/i-am-a-student');
  await expect(sections(page)).toBeVisible();
  await shot(page, 'unit-page', { full: true });
  await sections(page).getByRole('button', { name: /^言葉/ }).click();
  await expect(page.locator('[data-card]').first()).toBeVisible({ timeout: 15_000 });
  await shot(page, 'unit-words');
  await playSession(page);
  await expect(page.getByRole('link', { name: /^Next: / })).toBeVisible();
  await shot(page, 'unit-part-done', { full: true });
  await page.goto('/units/i-am-a-student');
  await expect(sections(page)).toContainText(/1 of \d/);
  await shot(page, 'unit-page-progress', { full: true });
  await sections(page)
    .getByRole('button', { name: /^読み物/ })
    .click();
  await expect(page.getByRole('region', { name: 'Passage' })).toBeVisible();
  await shot(page, 'unit-read', { full: true });
  await page.getByRole('button', { name: /Answer the questions/ }).click();
  await expect(page.locator('[data-card="passage"]')).toBeVisible();
  await shot(page, 'question-comprehension', { full: true });
  await page.getByRole('list', { name: 'Options' }).getByRole('button').first().click();
  await expect(page.locator('[data-evidence]')).toBeVisible();
  await shot(page, 'question-comprehension-answered', { full: true });
});

test('grammar: the index, a point, its intro and a particle', async ({ page }) => {
  await onboard(page);
  await page.goto('/grammar');
  await expect(page.getByRole('region', { name: 'Particles and function words' })).toBeVisible();
  await shot(page, 'grammar-index');
  await page.goto('/grammar/desu');
  await expect(page.getByRole('heading', { level: 1, name: '〜です' })).toBeVisible();
  await shotBothThemes(page, 'grammar-page');
  await shot(page, 'grammar-page-full', { full: true });
  await page.goto('/grammar/desu?intro=1');
  await expect(page.getByRole('region', { name: 'New grammar: 〜です' })).toBeVisible();
  await shot(page, 'grammar-intro', { full: true });
  await page.goto('/grammar/particle-ga');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  // The particle's fills on the page.
  await expect(page.getByText(/^Drill 1 of \d$/)).toBeVisible();
  await shot(page, 'grammar-particle', { full: true });
});

test('learned: what you have learned', async ({ page }) => {
  await onboard(page);
  await importKnown(page);
  await page.goto('/learned');
  await expect(page.getByRole('button', { name: /^N5 kanji: \d+ of \d+ known/ })).toBeVisible();
  await shot(page, 'learned', { full: true });
});

test('placement: a question and the result', async ({ page }) => {
  test.setTimeout(90_000);
  await onboard(page);
  await page.goto('/placement');
  await shot(page, 'placement-start');
  await page.getByRole('button', { name: 'Start' }).click();
  for (let n = 1; n <= 15; n += 1) {
    const card = page.getByRole('region', { name: `Question ${n} of about 15` });
    await expect(card).toBeVisible({ timeout: 15_000 });
    if (n === 1) await shot(page, 'placement-question');
    await card.getByRole('button', { name: "I don't know" }).click();
  }
  await expect(page.getByText('自己紹介を書いてください。')).toBeVisible();
  await page.getByRole('textbox').fill('はじめまして。わたしはアンナです。');
  await shot(page, 'placement-writing');
  await page.getByRole('button', { name: 'Done' }).click();
  await page.getByRole('button', { name: 'Ask the tutor to assess' }).click();
  await expect(page.getByRole('note', { name: "The tutor's assessment" })).toBeVisible();
  await shot(page, 'placement-result', { full: true });
});

test('settings: tutor, immersion, key help and AI use', async ({ page }) => {
  await onboard(page);
  await seedAiLog(page);
  await page.goto('/settings/tutor');
  await page.getByText('How to get a key').click();
  await shot(page, 'settings-key-help', { full: true });
  await page.goto('/settings/language');
  await shot(page, 'settings-tutor', {
    at: page.getByRole('group', { name: 'Explanations in' }),
  });
  await page.goto('/settings/tutor');
  await page.getByText('AI use this month').click();
  await expect(page.locator('figcaption', { hasText: /^Calls per day$/ })).toBeVisible();
  const charts = page.locator('figure').first();
  await shot(page, 'settings-ai-use', { at: charts });
  await page.emulateMedia({ colorScheme: 'dark' });
  await shot(page, 'settings-ai-use-dark', { at: charts });
  await page.emulateMedia({ colorScheme: 'light' });
});

test('settings: install help on an iPhone (N1b)', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Version/18.0 Safari/604.1',
    }),
  );
  await onboard(page);
  await page.goto('/settings/install');
  const install = page.getByRole('heading', { name: 'Install Kanji Tutor' });
  await shot(page, 'settings-install', { at: install });
});

test('today: the install banner on an iPhone (N1d)', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Version/18.0 Safari/604.1',
    }),
  );
  await onboard(page);
  await expect(page.getByRole('complementary', { name: 'Install the app' })).toBeVisible();
  await expect(page.locator('[data-loader]')).toHaveCount(0, { timeout: 15_000 });
  await expect(page.getByText("Choosing today's sentences…")).toBeHidden({ timeout: 15_000 });
  await shot(page, 'install-banner');
});

test('use it: romaji typed as kana, with kanji to pick (C6)', async ({ page }) => {
  await onboard(page);
  await page.goto('/compose');
  const pattern = page.getByLabel('PATTERN');
  const sentence = page.getByLabel('Your sentence', { exact: true });
  await expect(pattern.or(sentence)).toBeVisible();
  if (await pattern.isVisible()) {
    await pattern.fill('〜です');
    await page.getByLabel('MEANING').fill('to be');
    await page.getByRole('button', { name: 'Add grammar point' }).click();
  }
  await sentence.click();
  await shotBothThemes(page, 'compose-placeholder');
  await sentence.pressSequentially('watashihagakusei');
  await expect(page.getByRole('option', { name: '学生' })).toHaveAttribute('aria-selected', 'true');
  await shot(page, 'compose-typing');
  await page.emulateMedia({ colorScheme: 'dark' });
  await shot(page, 'compose-typing-dark');
  await page.emulateMedia({ colorScheme: 'light' });
});

test('session end: the check, the counts, the misses, Retry and Next session', async ({ page }) => {
  await onboard(page);
  await importKnown(page);
  await page.goto(`/read?kanji=${encodeURIComponent('待')}&reading=${encodeURIComponent('ま.つ')}`);
  await playSession(page);
  await expect(page.getByRole('button', { name: 'Next session' })).toBeVisible();
  await shotBothThemes(page, 'session-end');
});

test('use it: the red pen on the particle it names', async ({ page }) => {
  await onboard(page);
  await page.goto('/compose');
  const pattern = page.getByLabel('PATTERN');
  const sentence = page.getByLabel('Your sentence', { exact: true });
  await expect(pattern.or(sentence)).toBeVisible();
  if (await pattern.isVisible()) {
    await pattern.fill('〜じゃない');
    await page.getByLabel('MEANING').fill('is not');
    await page.getByRole('button', { name: 'Add grammar point' }).click();
  }
  await sentence.fill('私が犬はあまり好きじゃない');
  await page.getByRole('button', { name: /^Check/ }).click();
  await expect(page.getByText('Use は instead of が.')).toBeVisible({ timeout: 15_000 });
  await shot(page, 'compose-particles', { full: true });
});

test('navigation: Learn, Tutor, Settings and a category, the plan (IA3–IA6)', async ({ page }) => {
  await onboard(page);
  await page.goto('/learn');
  await expect(page.getByText(/^Unit \d+ of \d+ · N5$/)).toBeVisible({ timeout: 20_000 });
  await shot(page, 'learn', { full: true });
  await page.getByRole('searchbox', { name: 'Look up' }).fill('gakusei');
  await expect(page.getByRole('list', { name: 'Words' })).toBeVisible();
  await shot(page, 'learn-look-up');
  await page.goto('/tutor');
  await expect(page.getByRole('heading', { name: 'Tutor', level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Ask the tutor/ })).toBeVisible();
  await shotBothThemes(page, 'tutor');
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/settings');
  await expect(page.getByRole('link', { name: /^Sessions/ })).toBeVisible();
  await shot(page, 'settings', { full: true });
  await page.emulateMedia({ colorScheme: 'dark' });
  await shot(page, 'settings-dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/settings/sessions');
  await expect(page.getByRole('group', { name: 'Furigana' })).toBeVisible();
  await shot(page, 'settings-sessions', { full: true });
  await page.goto('/settings/appearance');
  await expect(page.getByRole('slider', { name: 'Sound' })).toBeVisible();
  await shotBothThemes(page, 'settings-appearance');
  await page.goto('/plan');
  await expect(page.getByRole('button', { name: 'Use this plan' })).toBeVisible();
  await shot(page, 'plan', { full: true });
});

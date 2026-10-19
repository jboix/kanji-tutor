import { expect, type Page, test } from '@playwright/test';
import { blockGemini, nextStep, stepHeading } from './helpers.ts';

/**
 * The welcome wizard (P5, P6), the long way: N4 with lists, a class lesson, a key checked with
 * Test key, then a change from the summary. Gemini stays blocked; only the test-key request gets
 * a routed fake answer, in this spec alone.
 */

const FAKE_OK = {
  candidates: [
    { content: { role: 'model', parts: [{ text: '{"ok":true}' }] }, finishReason: 'STOP' },
  ],
  usageMetadata: { promptTokenCount: 6, candidatesTokenCount: 4, totalTokenCount: 10 },
};

/** Answers the one Test key call with a fake success; returns the request count. */
async function fakeTestKey(page: Page): Promise<() => number> {
  let calls = 0;
  await page.route('**/generativelanguage.googleapis.com/**', (route) => {
    calls += 1;
    if (!route.request().url().includes(':generateContent')) return route.abort();
    return route.fulfill({ status: 200, contentType: 'application/json', json: FAKE_OK });
  });
  return () => calls;
}

async function toStart(page: Page) {
  await page.goto('/');
  await expect(page).toHaveURL(/\/welcome$/);
  await expect(page.getByText('1 of 9')).toBeVisible();
  await nextStep(page, 'Your language');
  await nextStep(page, 'Load the dictionary');
  await page.getByRole('button', { name: 'Load dictionary' }).click();
  await nextStep(page, 'Where you start');
}

async function knownAndClass(page: Page) {
  await page.getByRole('radio', { name: /I'm studying N4/ }).check();
  // Choosing only selects: the wizard stays on the step.
  await expect(stepHeading(page, 'Where you start')).toBeVisible();
  await nextStep(page, 'What you already know');
  await expect(page.getByRole('checkbox', { name: 'JLPT N5 (approximate list)' })).toBeChecked();
  await page.getByRole('checkbox', { name: 'Minna no Nihongo up to lesson' }).check();
  await page.getByLabel('Last Minna lesson').fill('12');
  await page.getByRole('button', { name: 'Next', exact: true }).click({ timeout: 30_000 });
  await expect(stepHeading(page, 'Your class')).toBeVisible({ timeout: 30_000 });
  await page.getByLabel('Textbook or course').fill('Tobira');
  await page.getByLabel('Current lesson').fill('第4課');
  await nextStep(page, 'Your AI tutor');
}

async function keyStep(page: Page, calls: () => number) {
  const studio = page.getByRole('link', { name: 'aistudio.google.com/apikey' });
  await expect(studio).toHaveAttribute('href', 'https://aistudio.google.com/apikey');
  await expect(studio).toHaveAttribute('target', '_blank');
  const field = page.getByLabel('API key', { exact: true });
  await field.fill('AIza-e2e-fake-key-0000000000');
  await expect(field).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Test key' }).click();
  await expect(page.getByText('Key works with gemini-3.5-flash-lite.')).toBeVisible();
  await expect(page.getByText('Key saved.')).toBeVisible();
  expect(calls()).toBe(1);
  await page.getByText('Advanced: models').click();
  await expect(page.getByLabel('Teacher model')).toHaveValue('gemini-3.5-flash-lite');
  await nextStep(page, 'How sessions feel');
  await nextStep(page, 'Your choices');
}

test('the full wizard: N4 with lists, a class, a tested key, a change, then Today', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await blockGemini(page);
  const calls = await fakeTestKey(page);
  await toStart(page);
  await knownAndClass(page);
  await keyStep(page, calls);

  const main = page.getByRole('main');
  await expect(main.getByText('Studying N4, level N4')).toBeVisible();
  await expect(main.getByText(/words? marked as known/)).toBeVisible();
  await expect(main.getByText('Tobira 第4課')).toBeVisible();
  await expect(main.getByText('Key saved in this browser')).toBeVisible();

  await page.getByRole('button', { name: 'Change where you start' }).click();
  await expect(stepHeading(page, 'Where you start')).toBeVisible();
  await page.getByRole('radio', { name: /I'm studying N3/ }).check();
  await nextStep(page, 'What you already know');
  await expect(page.getByRole('checkbox', { name: 'JLPT N4 (approximate list)' })).toBeChecked();
  await page.getByRole('button', { name: 'Back to summary' }).click({ timeout: 30_000 });
  await expect(stepHeading(page, 'Your choices')).toBeVisible({ timeout: 30_000 });
  await expect(main.getByText('Studying N3, level N3')).toBeVisible();

  await page.getByRole('button', { name: 'Start reading' }).click({ timeout: 30_000 });
  await expect(page).toHaveURL(/\/$/, { timeout: 30_000 });
  await page.goto('/welcome');
  await expect(page).toHaveURL(/\/$/);
});

test('a reload resumes the wizard where it stopped', async ({ page }) => {
  await blockGemini(page);
  await toStart(page);
  await page.getByRole('radio', { name: /I'm starting from zero/ }).check();
  await nextStep(page, 'What you already know');
  // Let the dictionary finish, then reload.
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect(stepHeading(page, 'Your class')).toBeVisible();
  await expect(page.getByRole('progressbar', { name: /in the background/ })).toHaveCount(0, {
    timeout: 30_000,
  });
  await page.reload();
  await expect(stepHeading(page, 'Your class')).toBeVisible();
  await expect(page.getByText('6 of 9')).toBeVisible();
});

test('the steps are reachable by keyboard alone', async ({ page }) => {
  await blockGemini(page);
  await page.goto('/');
  await expect(stepHeading(page, 'Welcome to Kanji Tutor')).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(stepHeading(page, 'Your language')).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('radio', { name: 'Français' })).toBeChecked();
  // Choosing a language switches the wizard to it at once (D52), and stays on the step.
  await expect(stepHeading(page, 'Votre langue')).toBeVisible();
});

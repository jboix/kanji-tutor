import { expect, type Page, test } from '@playwright/test';
import { answerField, beginMix, importKnown, onboard } from './helpers.ts';

/**
 * M1–M3 and A11 against the mock build. Japanese mode: the session copy turns Japanese, and the
 * tutor's mistake note (the mock's Japanese fixture) carries furigana and a gloss on 差, the one
 * word above the learner. Find my level: from zero, 15 questions, a proposed level, the mock
 * tutor's assessment, and the level accepted.
 */

async function setExplanations(page: Page, mode: 'Japanese' | 'Mixed') {
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('link', { name: /^Language/ }).click();
  const group = page.getByRole('group', { name: 'Explanations in' });
  await group.getByLabel(mode).click();
  await expect(group.getByLabel(mode)).toBeChecked();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('link', { name: 'Home', exact: true }).click();
}

test('Japanese mode: session copy and a tutor note with furigana on an unknown word', async ({
  page,
}) => {
  await onboard(page);
  await importKnown(page);
  await setExplanations(page, 'Japanese');
  await beginMix(page);

  const input = await answerField(page);
  await expect(input).toHaveAttribute('placeholder', '読み方は？ (Type the reading)');
  await expect(page.getByRole('button', { name: /分からない/ })).toBeVisible();
  await input.pressSequentially('nu');
  await input.press('Enter');
  await expect(page.getByText('あなたの答え')).toBeVisible();
  await page.getByRole('button', { name: 'Ask the tutor why' }).click();

  const note = page.getByRole('note', { name: 'Why this reading' });
  await expect(note).toContainText('「待つ」は駅で友達を待つときに使います。');
  const word = note.getByRole('button', { name: /^差.*: meaning$/ });
  await expect(word.locator('rt')).toHaveText('さ');
  await word.click();
  await expect(note.getByRole('status')).toContainText('difference');
  // Known words stay plain.
  await expect(note.getByRole('button', { name: /^駅.*: meaning$/ })).toHaveCount(0);
  await note.getByRole('button', { name: 'In my language' }).click();
  await expect(note).toContainText('Look at the left side of each kanji.');
  await expect(page.getByRole('button', { name: /^次(へ|の文へ)/ })).toBeVisible();
});

test('Find my level: from zero to a proposed level, assessed and accepted', async ({ page }) => {
  await onboard(page);
  await page.getByRole('link', { name: /Find my level/ }).click();
  await expect(page).toHaveURL(/\/placement$/);
  await page.getByRole('button', { name: 'Start' }).click();
  for (let n = 1; n <= 15; n += 1) {
    const card = page.getByRole('region', { name: `Question ${n} of about 15` });
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.getByRole('button', { name: "I don't know" }).click();
  }
  await expect(page.getByText('自己紹介を書いてください。')).toBeVisible();
  await page.getByRole('textbox').fill('はじめまして。わたしはアンナです。');
  await page.getByRole('button', { name: 'Done' }).click();

  await expect(page.getByRole('heading', { name: 'The questions point to N5.' })).toBeVisible();
  await expect(page.getByText(/^Kanji readings: not yet steady at N5\./)).toBeVisible();
  await page.getByRole('button', { name: 'Ask the tutor to assess' }).click();
  const note = page.getByRole('note', { name: "The tutor's assessment" });
  await expect(note).toContainText('The tutor suggests N4.');
  await page.getByRole('button', { name: 'Use N4' }).click();
  await expect(page.getByRole('status')).toContainText('Your level is now N4.');

  await page.getByRole('link', { name: 'Back to Home' }).click();
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('link', { name: /^Your words/ }).click();
  await expect(page.getByRole('group', { name: 'Your level' }).getByLabel('N4')).toBeChecked();
});

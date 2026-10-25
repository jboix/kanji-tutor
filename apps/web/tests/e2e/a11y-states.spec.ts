import { layoutReport, scanHere } from './a11y-checks.ts';
import { answerField, beginMix, importKnown, onboard } from './helpers.ts';
import { playUntil } from './lesson-play.ts';
import { patchSettings, seedAiLog } from './shots.ts';
import { expect, type Page, test } from './test.ts';

/**
 * Axe (light and dark), sideways scroll and 44 px targets on revision 2 states that are not a
 * first screen (N6, Issue 17): opened sheets, the intro card, feedback states, question cards,
 * a drill, the unit and grammar pages, placement and the AI use charts.
 */

const dontKnow = (page: Page) => page.getByRole('button', { name: "I don't know" });
const gotIt = (page: Page) => page.getByRole('button', { name: 'Got it' });
const onward = (page: Page) =>
  page.getByRole('button', { name: /^(Next sentence|Next word|Next question|Done)$/ });

/** Collects axe issues and layout problems for the state on screen. */
class Audit {
  readonly issues: string[] = [];
  constructor(private readonly page: Page) {}

  async check(label: string) {
    await this.page.waitForLoadState('networkidle');
    // Let sheets rise and answer animations end, so axe sees the final colours.
    await this.page.waitForTimeout(350);
    this.issues.push(...(await scanHere(this.page, label)));
    const report = await layoutReport(this.page);
    if (report.wide) this.issues.push(`${label}: scrolls sideways`);
    for (const target of report.small) this.issues.push(`${label}: small target ${target}`);
  }
}

async function ready(page: Page) {
  await onboard(page);
  await importKnown(page);
}

test('session states: intro, hint, sentence help, skip, word and particle sheets', async ({
  page,
}) => {
  test.setTimeout(120_000);
  const audit = new Audit(page);
  await ready(page);
  await beginMix(page);
  await expect(page.getByRole('region', { name: /^New word: / })).toBeVisible({ timeout: 15_000 });
  await audit.check('intro card');
  await answerField(page);
  await page.locator('main [data-target] button').first().click();
  await expect(page.getByRole('dialog', { name: /^Hint for / })).toBeVisible();
  await audit.check('hint sheet');
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).first().click();
  await page.getByRole('button', { name: 'Explain this sentence' }).click();
  await audit.check('sentence help');
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).first().click();
  await dontKnow(page).click();
  await expect(page.locator('[data-answer="skipped"]')).toBeVisible();
  await audit.check("I don't know");
  await page
    .locator('p[lang="ja"] button')
    .filter({ hasText: /^(は|が|を|に|で|の)$/ })
    .first()
    .click();
  await expect(page.getByRole('dialog', { name: / in this sentence$/ })).toBeVisible();
  await audit.check('particle sheet');
  expect(audit.issues).toEqual([]);
});

test('feedback states: right, wrong, and a Japanese tutor note', async ({ page }) => {
  test.setTimeout(90_000);
  const audit = new Audit(page);
  await ready(page);
  await page.goto(
    `/read?kanji=${encodeURIComponent('紹')}&reading=${encodeURIComponent('ショウ')}`,
  );
  const right = await answerField(page);
  await right.pressSequentially('shoukai');
  await right.press('Enter');
  await expect(page.locator('[data-answer="correct"]')).toBeVisible();
  await audit.check('right answer');
  await page.goto('/settings/language');
  const group = page.getByRole('group', { name: 'Explanations in' });
  await group.getByLabel('Japanese').click();
  await expect(group.getByLabel('Japanese')).toBeChecked();
  await page.goto('/read');
  const wrong = await answerField(page);
  await wrong.pressSequentially('nu');
  await wrong.press('Enter');
  await audit.check('wrong answer');
  await page.getByRole('button', { name: 'Ask the tutor why' }).click();
  await expect(page.getByRole('note', { name: 'Why this reading' })).toBeVisible();
  await audit.check('Japanese mistake note');
  expect(audit.issues).toEqual([]);
});

/** On to the next card: "Got it" on an intro, else "I don't know" and onward. */
async function advance(page: Page) {
  await expect(gotIt(page).or(dontKnow(page)).or(onward(page)).first()).toBeVisible();
  if (await gotIt(page).isVisible()) return gotIt(page).click();
  if (await dontKnow(page).isVisible()) await dontKnow(page).click();
  await onward(page).first().click();
}

async function cardType(page: Page) {
  const card = page.locator('[data-card]').first();
  await expect(card.or(page.getByText('Session done')).first()).toBeVisible({ timeout: 15_000 });
  return (await card.count()) > 0 ? ((await card.getAttribute('data-card')) ?? '') : 'done';
}

test('question cards and a drill, asked and answered', async ({ page }) => {
  test.setTimeout(150_000);
  const audit = new Audit(page);
  await ready(page);
  // A 15-minute session has room for every kind (L6).
  await patchSettings(page, { sessionMinutes: 15 });
  await page.goto('/read?questions=1&drills=1');
  const seen = new Set<string>();
  for (let card = 0; card < 40 && seen.size < 6; card++) {
    const type = await cardType(page);
    if (type === 'done') break;
    const kind = type.startsWith('drill:') ? 'drill' : type;
    if (kind.startsWith('question:') || kind === 'drill') {
      if (!seen.has(kind)) await audit.check(kind);
      if (!seen.has(kind) && (await dontKnow(page).isVisible())) {
        await dontKnow(page).click();
        await audit.check(`${kind} answered`);
      }
      seen.add(kind);
    }
    await advance(page);
  }
  expect([...seen].length).toBeGreaterThanOrEqual(4);
  expect(audit.issues).toEqual([]);
});

test('units, grammar, learned, placement and the AI use charts', async ({ page }) => {
  test.setTimeout(150_000);
  const audit = new Audit(page);
  await onboard(page);
  await seedAiLog(page);
  for (const path of ['/units', '/units/self-introduction', '/grammar', '/grammar/desu']) {
    await page.goto(path);
    await audit.check(path);
  }
  for (const path of ['/grammar/particle-ga', '/grammar/desu?intro=1', '/learned']) {
    await page.goto(path);
    await audit.check(path);
  }
  await page.goto('/units/self-introduction');
  await page.getByRole('button', { name: /^読み物/ }).click();
  await audit.check('unit passage');
  await page.getByRole('button', { name: /Answer the questions/ }).click();
  await page.getByRole('list', { name: 'Options' }).getByRole('button').first().click();
  await expect(page.locator('[data-evidence]')).toBeVisible();
  await audit.check('読解 answered');
  await placement(page, audit);
  await page.goto('/settings/tutor');
  await page.getByText('AI use this month').click();
  await page.getByText('How to get a key').click();
  await audit.check('settings with AI use and key help');
  expect(audit.issues).toEqual([]);
});

async function placement(page: Page, audit: Audit) {
  await page.goto('/placement');
  await page.getByRole('button', { name: 'Start' }).click();
  for (let n = 1; n <= 15; n += 1) {
    const card = page.getByRole('region', { name: `Question ${n} of about 15` });
    await expect(card).toBeVisible({ timeout: 15_000 });
    if (n === 1) await audit.check('placement question');
    await card.getByRole('button', { name: "I don't know" }).click();
  }
  await page.getByRole('textbox').fill('はじめまして。');
  await page.getByRole('button', { name: 'Done' }).click();
  await page.getByRole('button', { name: 'Ask the tutor to assess' }).click();
  await expect(page.getByRole('note', { name: "The tutor's assessment" })).toBeVisible();
  await audit.check('placement result');
}

test('the S4 exercises of a unit lesson, asked and answered (S3, S4)', async ({ page }) => {
  test.setTimeout(150_000);
  const audit = new Audit(page);
  await onboard(page);
  const kinds = [
    ['words', 'drill:meaning'],
    ['grammar', 'drill:pattern'],
    ['grammar', 'drill:build'],
    ['review', 'drill:particle'],
  ] as const;
  for (const [section, kind] of kinds) {
    await page.goto(`/read?unit=i-am-a-student&section=${section}&part=1`);
    expect(await playUntil(page, kind), kind).toBe(true);
    await audit.check(`${kind} asked`);
    await page.getByRole('button', { name: "I don't know" }).click();
    await audit.check(`${kind} answered`);
  }
  await page.goto('/grammar/desu');
  await expect(page.getByText(/^Drill 1 of/)).toBeVisible();
  await audit.check('grammar page practice');
  expect(audit.issues).toEqual([]);
});

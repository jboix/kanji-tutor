import { answerField, importKnown, onboard } from './helpers.ts';
import { expect, type Locator, type Page, test } from './test.ts';

/**
 * The popup sits right by the kana at `index`: its bottom just above the line's glyphs (or its top
 * just below them), starting at that kana, inside the page and clear of the text (C6).
 */
async function expectByKana(page: Page, field: Locator, popup: Locator, index: number) {
  const [box, pop] = [await field.boundingBox(), await popup.boundingBox()];
  if (!box || !pop) throw new Error('field or popup not laid out');
  const metrics = await field.evaluate((node) => {
    const style = getComputedStyle(node);
    const line = Number.parseFloat(style.lineHeight) || node.clientHeight;
    return {
      font: Number.parseFloat(style.fontSize),
      line,
      padTop: Number.parseFloat(style.paddingTop),
      padLeft: Number.parseFloat(style.paddingLeft),
    };
  });
  // Glyphs sit in the middle of the first line box (single-line inputs centre them too).
  const lineTop = box.y + metrics.padTop;
  const glyphTop = lineTop + (Math.min(metrics.line, box.height) - metrics.font) / 2;
  expect(pop.y + pop.height).toBeLessThanOrEqual(glyphTop + 1);
  expect(pop.y + pop.height).toBeGreaterThanOrEqual(lineTop - 24);
  const kanaLeft = box.x + metrics.padLeft + index * metrics.font;
  const width = page.viewportSize()?.width ?? 0;
  // It starts at the kana, unless that would push it past the side of its parent.
  const right = await popup.evaluate((node) => node.parentElement?.getBoundingClientRect().right);
  const expected = Math.min(kanaLeft, (right ?? width) - pop.width);
  expect(Math.abs(pop.x - expected)).toBeLessThan(6);
  expect(pop.x).toBeGreaterThanOrEqual(0);
  expect(pop.x + pop.width).toBeLessThanOrEqual(width);
  const scroll = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scroll).toBeLessThanOrEqual(width);
  for (const option of await popup.getByRole('option').all()) {
    expect((await option.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
}

/** Selects part of a field the way a long press would, so the row follows the selection. */
async function select(field: Locator, start: number, end: number) {
  await field.evaluate(
    (node, [from, to]) => {
      const input = node as HTMLInputElement;
      input.setSelectionRange(from ?? 0, to ?? 0);
      input.dispatchEvent(new Event('select', { bubbles: true }));
    },
    [start, end],
  );
}

/** Use it, with a grammar point to write about. */
async function openCompose(page: Page) {
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
}

test('Use it: romaji becomes kana and the phrase comes back in kanji from a popup', async ({
  page,
}) => {
  await openCompose(page);
  const sentence = page.getByLabel('Your sentence', { exact: true });
  await sentence.click();
  await sentence.pressSequentially('watashihagakusei');
  await expect(sentence).toHaveValue('わたしはがくせい');
  const popup = page.getByRole('listbox', { name: 'Kanji for わたしはがくせい' });
  const phrase = popup.getByRole('option', { name: '私は学生', exact: true });
  await expect(phrase).toBeVisible();
  await expect(phrase).toHaveAttribute('lang', 'ja');
  await expect(phrase).toHaveCSS('font-family', /Klee One/);
  await expect(phrase).toHaveCSS('border-radius', '0px');
  await expectByKana(page, sentence, popup, 0);

  // A selection is looked up as it is.
  await select(sentence, 0, 3);
  const me = page.getByRole('listbox', { name: 'Kanji for わたし' });
  await expectByKana(page, sentence, me, 0);
  await me.getByRole('option', { name: '私', exact: true }).click();
  await expect(sentence).toHaveValue('私はがくせい');
  await sentence.press('End');
  const rest = page.getByRole('listbox', { name: 'Kanji for はがくせい' });
  await expectByKana(page, sentence, rest, 1);
  await rest.getByRole('option', { name: 'は学生', exact: true }).tap();
  await expect(sentence).toHaveValue('私は学生');
  await expect(sentence).toBeFocused();
  await sentence.pressSequentially('desu');
  await expect(sentence).toHaveValue('私は学生です');
});

test('Use it: the first line converts the first word only, and the next word follows', async ({
  page,
}) => {
  await openCompose(page);
  const sentence = page.getByLabel('Your sentence', { exact: true });
  await sentence.click();
  await sentence.pressSequentially('watashihagakusei');
  const popup = page.getByRole('listbox', { name: 'Kanji for わたしはがくせい' });
  const first = popup.getByRole('option').first();
  await expect(first).toHaveAccessibleName('First word only: 私, then は学生');
  await expect(first).toHaveAttribute('aria-selected', 'true');
  // The first word in ink, what would follow greyed, on a line of its own above the phrases.
  const [word, next] = [first.locator('span').nth(0), first.locator('span').nth(1)];
  await expect(word).toHaveText('私');
  await expect(next).toHaveText('は学生');
  const ink = await word.evaluate((node) => getComputedStyle(node).color);
  await expect(next).not.toHaveCSS('color', ink);
  await expect(next).toHaveCSS('font-family', /Klee One/);
  await first.tap();
  await expect(sentence).toHaveValue('私はがくせい');
  await expect(sentence).toBeFocused();
  const after = page.getByRole('listbox', { name: 'Kanji for はがくせい' });
  await expect(after.getByRole('option').first()).toHaveAccessibleName(
    'First word only: は, then 学生',
  );
  await sentence.press('Enter');
  await expect(page.getByRole('listbox', { name: 'Kanji for がくせい' })).toBeVisible();
  await sentence.press('Enter');
  await expect(sentence).toHaveValue('私は学生');
  await expect(page.getByRole('listbox')).toBeHidden();
});

test('Use it: the first kanji is highlighted, Enter converts, ↑ never jumps to the last', async ({
  page,
}) => {
  await openCompose(page);
  const sentence = page.getByLabel('Your sentence', { exact: true });
  await sentence.click();
  await sentence.pressSequentially('watashi');
  const popup = page.getByRole('listbox', { name: 'Kanji for わたし' });
  const options = popup.getByRole('option');
  await expect(options.first()).toBeVisible();
  const first = options.first();
  const id = async (index: number) => (await options.nth(index).getAttribute('id')) ?? '';
  // Highlighted from the start, visibly: a soft fill and the ink bar.
  await expect(first).toHaveAttribute('aria-selected', 'true');
  await expect(sentence).toHaveAttribute('aria-activedescendant', await id(0));
  await expect(first).not.toHaveCSS('box-shadow', 'none');
  await sentence.press('ArrowUp');
  await expect(sentence).toHaveAttribute('aria-activedescendant', await id(0));
  const count = await options.count();
  if (count > 1) {
    await sentence.press('ArrowDown');
    await expect(sentence).toHaveAttribute('aria-activedescendant', await id(1));
    await sentence.press('ArrowLeft');
    await expect(sentence).toHaveAttribute('aria-activedescendant', await id(0));
  }
  const form = (await first.textContent()) ?? '';
  await sentence.press('Enter');
  await expect(sentence).toHaveValue(form);
  await expect(sentence).toBeFocused();

  // Escape keeps the kana; nothing is converted.
  await sentence.pressSequentially('gakusei');
  await expect(page.getByRole('listbox', { name: 'Kanji for がくせい' })).toBeVisible();
  await sentence.press('Escape');
  await expect(page.getByRole('listbox')).toBeHidden();
  await expect(sentence).toHaveValue(`${form}がくせい`);
});

test('Use it: capitals and the ア switch type katakana, which gets no kanji', async ({ page }) => {
  await openCompose(page);
  const sentence = page.getByLabel('Your sentence', { exact: true });
  await sentence.click();
  await sentence.pressSequentially('KO-HI-');
  await expect(sentence).toHaveValue('コーヒー');
  const toggle = page.getByRole('button', { name: 'Romaji turns into hiragana' });
  await expect(toggle).toHaveText('あ');
  await toggle.click();
  const katakana = page.getByRole('button', { name: 'Romaji turns into katakana' });
  await expect(katakana).toHaveText('ア');
  await expect(sentence).toBeFocused();
  await sentence.pressSequentially('te-buru');
  await expect(sentence).toHaveValue('コーヒーテーブル');
  await page.waitForTimeout(300);
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await katakana.click();
  const off = page.getByRole('button', { name: 'Romaji stays as typed' });
  await expect(off).toHaveText('A');
  await sentence.pressSequentially(' ok');
  await expect(sentence).toHaveValue('コーヒーテーブル ok');
  // Drawn at 36px; its touch target reaches 44px (N6).
  expect((await off.boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(36);
});

test("Use it: the placeholder is set in the sentence's own type, where the caret is", async ({
  page,
}) => {
  await openCompose(page);
  const sentence = page.getByLabel('Your sentence', { exact: true });
  await expect(sentence).toHaveAttribute('placeholder', 'Type or dictate in Japanese');
  const [field, hint] = await sentence.evaluate((node) =>
    [getComputedStyle(node), getComputedStyle(node, '::placeholder')].map((style) => [
      style.fontFamily,
      style.fontSize,
      style.lineHeight,
      style.letterSpacing,
    ]),
  );
  expect(hint).toEqual(field);
  expect(field?.[0]).toMatch(/Klee One/);
});

test('Use it: the kana a pick would replace is underlined over the text, as an IME marks it', async ({
  page,
}) => {
  await openCompose(page);
  const sentence = page.getByLabel('Your sentence', { exact: true });
  await sentence.click();
  await sentence.pressSequentially('watashihagakusei');
  await expect(page.getByRole('option', { name: '私は学生', exact: true })).toBeVisible();
  // The first word is the highlighted part; the rest of the phrase is pending.
  const selected = page.locator('[data-segment="selected"]');
  await expect(selected).toHaveText('わたし');
  await expect(page.locator('[data-segment="pending"]')).toHaveText('はがくせい');
  // The mirror lies exactly over the field, in the field's type.
  const [field, mirror] = await Promise.all([
    sentence.boundingBox(),
    selected.evaluate((node) => {
      const box = node.parentElement?.getBoundingClientRect();
      return box && { x: box.x, y: box.y, width: box.width, height: box.height };
    }),
  ]);
  expect(Math.abs((mirror?.x ?? 0) - (field?.x ?? 0))).toBeLessThan(1);
  expect(Math.abs((mirror?.y ?? 0) - (field?.y ?? 0))).toBeLessThan(1);
  expect(Math.abs((mirror?.width ?? 0) - (field?.width ?? 0))).toBeLessThan(1);
  await expect(selected).toHaveCSS('font-family', /Klee One/);
  await expect(selected).toHaveCSS('color', 'rgba(0, 0, 0, 0)');
  // Once the first word is in, the next one is marked: it starts where the field draws its 2nd
  // character.
  await sentence.press('Enter');
  await expect(sentence).toHaveValue('私はがくせい');
  await expect(selected).toHaveText('は');
  const left = await selected.evaluate((node) => node.getBoundingClientRect().left);
  const font = Number.parseFloat(await sentence.evaluate((n) => getComputedStyle(n).fontSize));
  expect(Math.abs(left - ((field?.x ?? 0) + font))).toBeLessThan(3);
  await sentence.press('Escape');
  await expect(page.locator('[data-segment]')).toHaveCount(0);
});

test('Use it: a Japanese keyboard switches our conversion, marks and popup off', async ({
  page,
}) => {
  await openCompose(page);
  const sentence = page.getByLabel('Your sentence', { exact: true });
  await sentence.click();
  await sentence.dispatchEvent('compositionstart');
  await page.keyboard.insertText('がくせい');
  await sentence.dispatchEvent('compositionend');
  await expect(sentence).toHaveValue('がくせい');
  const toggle = page.getByRole('button', { name: /^Japanese keyboard in use/ });
  await expect(toggle).toHaveText('IME');
  await page.waitForTimeout(300);
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(page.locator('[data-segment]')).toHaveCount(0);
  await sentence.pressSequentially('ka');
  await expect(sentence).toHaveValue('がくせいka');
  // Remembered for the session: the field comes back with the keyboard's mode.
  await page.reload();
  await expect(page.getByRole('button', { name: /^Japanese keyboard in use/ })).toBeVisible();
  await page.getByRole('button', { name: /^Japanese keyboard in use/ }).click();
  await expect(page.getByRole('button', { name: 'Romaji turns into hiragana' })).toBeVisible();
});

test('Ask box: the あ switch types kana and the popup offers kanji', async ({ page }) => {
  await onboard(page);
  await importKnown(page);
  await page.goto(`/read?kanji=${encodeURIComponent('待')}&reading=${encodeURIComponent('ま.つ')}`);
  const ask = page.getByLabel(/^Ask about /);
  for (let step = 0; step < 4 && !(await ask.isVisible()); step++) {
    const input = await answerField(page);
    await input.pressSequentially('nu');
    await input.press('Enter');
    await expect(ask.or(page.getByRole('button', { name: 'Next word' }))).toBeVisible();
    if (!(await ask.isVisible())) await page.getByRole('button', { name: 'Next word' }).click();
  }
  await expect(ask).toBeVisible();
  await page.getByRole('button', { name: 'Type romaji as kana' }).click();
  await ask.click();
  await ask.pressSequentially('sensei');
  await expect(ask).toHaveValue('せんせい');
  const popup = page.getByRole('listbox', { name: 'Kanji for せんせい' });
  await expect(popup.getByRole('option', { name: '先生' })).toBeVisible();
  await expectByKana(page, ask, popup, 0);
  await popup.getByRole('option', { name: '先生' }).tap();
  await expect(ask).toHaveValue('先生');
  await expect(ask).toBeFocused();
  // Enter turns the highlighted first kanji in; only the next Enter sends.
  await ask.pressSequentially('gakusei');
  await expect(page.getByRole('listbox', { name: 'Kanji for がくせい' })).toBeVisible();
  await ask.press('Enter');
  await expect(ask).toHaveValue('先生学生');
});

import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Repos } from '../domain/repos.ts';
import { captureDictionary } from '../domain/services/capture-fixtures.ts';
import type { Word } from '../domain/types.ts';
import { createMemoryRepos } from '../test/memory-repos.ts';
import { readingRepos } from '../test/reading-fixtures.ts';
import { fakeServices, renderWithServices } from '../test/render.tsx';
import { AskInput } from './ask-input.tsx';
import { finalText, kanaEdit, nativeInput, nextKanaMode } from './use-japanese-typing.ts';

async function renderAsk(onSubmit = vi.fn(), given?: Repos) {
  const repos = given ?? (await readingRepos());
  renderWithServices(<AskInput label="Ask" onSubmit={onSubmit} />, {
    services: fakeServices({ repos }),
  });
  return { field: screen.getByLabelText('Ask') as HTMLInputElement, onSubmit };
}

describe('kanaEdit (C6)', () => {
  it('converts romaji on both sides of the caret and keeps the caret after the new kana', () => {
    expect(kanaEdit('watashi', 7)).toEqual({ text: 'わたし', caret: 3 });
    expect(kanaEdit('学生deす', 4)).toEqual({ text: '学生です', caret: 3 });
    expect(kanaEdit('kan', 3)).toEqual({ text: 'かn', caret: 2 });
  });

  it('types katakana from capitals, or from any romaji in katakana mode (D109)', () => {
    expect(kanaEdit('KOHI-', 5)).toEqual({ text: 'コヒー', caret: 3 });
    expect(kanaEdit('わたしはANNA', 9)).toEqual({ text: 'わたしはアンア', caret: 7 });
    expect(kanaEdit('ko-hi-', 6, 'katakana')).toEqual({ text: 'コーヒー', caret: 4 });
    expect(kanaEdit('がくせいpan', 7, 'katakana')).toEqual({ text: 'がくせいパN', caret: 6 });
    expect(finalText('pan', 'katakana')).toBe('パン');
    expect(finalText('hon', 'hiragana')).toBe('ほん');
    expect(finalText('hon', 'off')).toBe('hon');
  });

  it('cycles あ → ア → A → あ', () => {
    expect(nextKanaMode('hiragana')).toBe('katakana');
    expect(nextKanaMode('katakana')).toBe('off');
    expect(nextKanaMode('off')).toBe('hiragana');
    expect(nextKanaMode('native')).toBe('hiragana');
    expect(finalText('kan', 'native')).toBe('kan');
  });

  it('knows a Japanese keyboard by the Japanese it types, not by a paste (D112)', () => {
    expect(nativeInput({ inputType: 'insertText', data: 'あ' })).toBe(true);
    expect(nativeInput({ inputType: 'insertCompositionText', data: '学生' })).toBe(true);
    expect(nativeInput({ inputType: 'insertReplacementText', data: 'ア' })).toBe(true);
    expect(nativeInput({ inputType: 'insertText', data: 'a' })).toBe(false);
    expect(nativeInput({ inputType: 'insertFromPaste', data: 'がくせい' })).toBe(false);
    expect(nativeInput({})).toBe(false);
  });
});

/** はし has three spellings: 箸, 橋 and 端. */
function bridgeRepos(): Repos {
  const word = (id: string, form: string): Word => ({
    id,
    forms: [form],
    readings: ['はし'],
    glosses: [],
    common: true,
  });
  return createMemoryRepos({
    dictionary: captureDictionary([word('1', '箸'), word('2', '橋'), word('3', '端')]),
  });
}

/** Turns the Ask box's あ switch on (it starts off: questions are often in English). */
const kanaOn = () => userEvent.click(screen.getByRole('button', { name: 'Type romaji as kana' }));

describe('AskInput (A4, C6)', () => {
  it('keeps English as typed until the あ switch is on', async () => {
    const { field, onSubmit } = await renderAsk();
    const toggle = screen.getByRole('button', { name: 'Type romaji as kana' });
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    await userEvent.type(field, 'Why wa?{Enter}');
    expect(onSubmit).toHaveBeenLastCalledWith('Why wa?');
    await userEvent.click(toggle);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    await userEvent.type(field, 'hon');
    expect(field.value).toBe('ほn');
    await userEvent.keyboard('{Escape}{Enter}');
    expect(onSubmit).toHaveBeenLastCalledWith('ほん');
    expect(field.value).toBe('');
  });

  it('has no ア mode and no IME detection: those belong to the sentence field (D113)', async () => {
    const { field } = await renderAsk();
    await kanaOn();
    await userEvent.click(screen.getByRole('button', { name: 'Type romaji as kana' }));
    expect(
      screen.getByRole('button', { name: 'Type romaji as kana' }).getAttribute('aria-pressed'),
    ).toBe('false');
    fireEvent.compositionStart(field);
    fireEvent.compositionEnd(field);
    expect(screen.getByRole('button', { name: 'Type romaji as kana' })).toBeTruthy();
  });

  it('offers kanji for the kana before the caret and a tap replaces it', async () => {
    const { field } = await renderAsk();
    await kanaOn();
    await userEvent.type(field, 'korehagakusei');
    expect(field.value).toBe('これはがくせい');
    const popup = await screen.findByRole('listbox', { name: 'Kanji for がくせい' });
    const student = await screen.findByRole('option', { name: '学生' });
    expect(popup.contains(student)).toBe(true);
    expect(student.getAttribute('lang')).toBe('ja');
    expect(fireEvent.mouseDown(student)).toBe(false);
    await userEvent.click(student);
    expect(field.value).toBe('これは学生');
    expect(field.selectionStart).toBe(5);
    expect(document.activeElement).toBe(field);
  });

  it('offers kanji for selected kana typed with an IME', async () => {
    const { field } = await renderAsk();
    fireEvent.change(field, { target: { value: 'ほんをよむ' } });
    field.setSelectionRange(0, 2);
    fireEvent.select(field);
    await userEvent.click(await screen.findByRole('option', { name: '本' }));
    expect(field.value).toBe('本をよむ');
  });

  it('highlights the first kanji at once; Enter turns the kana into it, not a submit', async () => {
    const { field, onSubmit } = await renderAsk();
    await kanaOn();
    await userEvent.type(field, 'gakusei');
    const popup = await screen.findByRole('listbox', { name: 'Kanji for がくせい' });
    const options = screen.getAllByRole('option');
    expect(field.getAttribute('aria-controls')).toBe(popup.id);
    expect(field.getAttribute('aria-autocomplete')).toBe('list');
    expect(field.getAttribute('aria-activedescendant')).toBe(options[0]?.id);
    expect(options[0]?.getAttribute('aria-selected')).toBe('true');
    await userEvent.keyboard('{Enter}');
    expect(field.value).toBe('学生');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(field);
  });

  it('moves from the first with ↓/→ and back with ↑/←, never wrapping to the last', async () => {
    const { field } = await renderAsk(vi.fn(), bridgeRepos());
    await kanaOn();
    await userEvent.type(field, 'hashi');
    await screen.findByRole('listbox', { name: 'Kanji for はし' });
    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(1);
    const active = () => field.getAttribute('aria-activedescendant');
    await userEvent.keyboard('{ArrowUp}');
    expect(active()).toBe(options[0]?.id);
    await userEvent.keyboard('{ArrowDown}');
    expect(active()).toBe(options[1]?.id);
    await userEvent.keyboard('{ArrowLeft}');
    expect(active()).toBe(options[0]?.id);
    await userEvent.keyboard('{ArrowRight}{Enter}');
    expect(field.value).toBe(options[1]?.textContent);
  });

  it('Escape closes the popup and keeps the kana until it changes; Space types a space', async () => {
    const { field, onSubmit } = await renderAsk();
    await kanaOn();
    await userEvent.type(field, 'hon');
    await userEvent.type(field, 'n');
    await screen.findByRole('listbox', { name: 'Kanji for ほん' });
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(field.hasAttribute('aria-controls')).toBe(false);
    expect(field.value).toBe('ほん');
    await userEvent.type(field, 'wo');
    await userEvent.keyboard('{Backspace}');
    await screen.findByRole('listbox', { name: 'Kanji for ほん' });
    await userEvent.keyboard('[Space]');
    expect(field.value).toBe('ほん ');
    await userEvent.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenLastCalledWith('ほん');
  });

  it('leaves ←/→ to the caret when the popup opened because the caret moved', async () => {
    const { field } = await renderAsk();
    fireEvent.change(field, { target: { value: 'ほんをよむ' } });
    await new Promise((done) => setTimeout(done, 150));
    field.setSelectionRange(2, 2);
    fireEvent.select(field);
    await screen.findByRole('listbox', { name: 'Kanji for ほん' });
    const options = screen.getAllByRole('option');
    expect(field.getAttribute('aria-activedescendant')).toBe(options[0]?.id);
    expect(fireEvent.keyDown(field, { key: 'ArrowLeft' })).toBe(true);
    expect(fireEvent.keyDown(field, { key: 'ArrowDown' })).toBe(false);
  });
});

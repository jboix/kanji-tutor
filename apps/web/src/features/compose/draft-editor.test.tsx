import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { readingRepos } from '../../test/reading-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { DraftEditor } from './draft-editor.tsx';

function Draft() {
  const [text, setText] = useState('');
  return <DraftEditor text={text} onChange={setText} error={undefined} disabled={false} />;
}

async function renderDraft() {
  renderWithServices(<Draft />, { services: fakeServices({ repos: await readingRepos() }) });
  return screen.getByRole('textbox') as HTMLTextAreaElement;
}

const segment = (kind: string) =>
  [...document.querySelectorAll(`[data-segment="${kind}"]`)].map((node) => node.textContent);

describe('DraftEditor (C6)', () => {
  beforeEach(() => sessionStorage.clear());

  it('turns romaji into kana and offers kanji spellings under the field', async () => {
    renderWithServices(<Draft />, { services: fakeServices({ repos: await readingRepos() }) });
    const field = screen.getByRole('textbox') as HTMLTextAreaElement;
    await userEvent.type(field, 'gakuseidesu');
    expect(field.value).toBe('がくせいです');
    // Escape keeps the kana; the caret then moves back over です.
    await userEvent.type(field, '{Escape}{ArrowLeft}{ArrowLeft}');
    await userEvent.click(await screen.findByRole('option', { name: '学生' }));
    expect(field.value).toBe('学生です');
    expect(field.selectionStart).toBe(2);
  });

  it('cycles the あ switch: katakana on ア, romaji as typed on A', async () => {
    renderWithServices(<Draft />, { services: fakeServices({ repos: await readingRepos() }) });
    const field = screen.getByRole('textbox') as HTMLTextAreaElement;
    await userEvent.click(screen.getByRole('button', { name: 'Romaji turns into hiragana' }));
    await userEvent.type(field, 'te-buru');
    expect(field.value).toBe('テーブル');
    await userEvent.click(screen.getByRole('button', { name: 'Romaji turns into katakana' }));
    expect(screen.getByRole('button', { name: 'Romaji stays as typed' })).toBeTruthy();
    await userEvent.type(field, ' OK');
    expect(field.value).toBe('テーブル OK');
  });

  it('turns the first kanji in with Enter, without a new line', async () => {
    renderWithServices(<Draft />, { services: fakeServices({ repos: await readingRepos() }) });
    const field = screen.getByRole('textbox') as HTMLTextAreaElement;
    await userEvent.type(field, 'gakusei');
    await screen.findByRole('option', { name: '学生' });
    await userEvent.keyboard('{Enter}');
    expect(field.value).toBe('学生');
  });

  it('marks the phrase a pick would convert, the highlighted first word more strongly', async () => {
    const field = await renderDraft();
    await userEvent.type(field, 'korehagakusei');
    await screen.findByRole('listbox', { name: 'Kanji for これはがくせい' });
    expect(segment('selected')).toEqual(['これ']);
    expect(segment('pending')).toEqual(['はがくせい']);
    const mark = document.querySelector('[data-segment="selected"]')?.parentElement;
    expect(mark?.textContent).toBe('これはがくせい');
    expect(mark?.closest('[aria-hidden="true"]')).toBeTruthy();
    // Enter takes the first word; the next one is marked and offered at once.
    await userEvent.keyboard('{Enter}');
    await screen.findByRole('listbox', { name: 'Kanji for はがくせい' });
    expect(segment('selected')).toEqual(['は']);
    await userEvent.keyboard('{Enter}');
    await screen.findByRole('listbox', { name: 'Kanji for がくせい' });
    expect(segment('selected')).toEqual(['がくせい']);
    await userEvent.keyboard('{Enter}');
    expect(field.value).toBe('これは学生');
    await waitFor(() => expect(document.querySelector('[data-segment]')).toBeNull());
  });

  it('clears the mark on Escape and keeps the kana', async () => {
    const field = await renderDraft();
    await userEvent.type(field, 'gakusei');
    await screen.findByRole('option', { name: '学生' });
    await userEvent.keyboard('{Escape}');
    expect(document.querySelector('[data-segment]')).toBeNull();
    expect(field.value).toBe('がくせい');
  });

  it('switches ours off when a Japanese keyboard composes, and never touches its text', async () => {
    const field = await renderDraft();
    fireEvent.compositionStart(field);
    fireEvent.compositionUpdate(field, { data: 'がくせい' });
    fireEvent.change(field, { target: { value: 'がくせい' } });
    expect(field.value).toBe('がくせい');
    fireEvent.compositionEnd(field, { data: 'がくせい' });
    const toggle = screen.getByRole('button', {
      name: 'Japanese keyboard in use: romaji conversion off',
    });
    expect(toggle.textContent).toBe('IME');
    await new Promise((done) => setTimeout(done, 150));
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(document.querySelector('[data-segment]')).toBeNull();
    // Romaji typed now stays romaji: the device's keyboard does the converting.
    await userEvent.type(field, 'ka');
    expect(field.value).toBe('がくせいka');
  });

  it('is not fooled by a keyboard that composes Latin words (Android)', async () => {
    const field = await renderDraft();
    fireEvent.compositionStart(field);
    fireEvent.compositionUpdate(field, { data: 'ka' });
    fireEvent.change(field, { target: { value: 'ka' } });
    expect(field.value).toBe('ka');
    fireEvent.compositionEnd(field, { data: 'ka' });
    expect(field.value).toBe('か');
    expect(screen.getByRole('button', { name: 'Romaji turns into hiragana' })).toBeTruthy();
  });

  it('takes text typed already in Japanese as a Japanese keyboard too', async () => {
    const field = await renderDraft();
    await userEvent.type(field, 'がくせい');
    expect(screen.getByRole('button', { name: /^Japanese keyboard in use/ })).toBeTruthy();
    expect(JSON.parse(sessionStorage.getItem('kanji-tutor:compose-typing') ?? '{}')).toEqual({
      mode: 'native',
      chosen: false,
    });
  });

  it('remembers the keyboard for the session, and a press turns ours back on for good', async () => {
    const first = await renderDraft();
    fireEvent.compositionStart(first);
    fireEvent.compositionEnd(first, { data: '本' });
    document.body.innerHTML = '';
    const field = await renderDraft();
    const toggle = screen.getByRole('button', { name: /^Japanese keyboard in use/ });
    await userEvent.click(toggle);
    expect(toggle.getAttribute('aria-label')).toBe('Romaji turns into hiragana');
    fireEvent.compositionStart(field);
    fireEvent.compositionEnd(field, { data: '本' });
    expect(toggle.getAttribute('aria-label')).toBe('Romaji turns into hiragana');
    // An IME composition is never converted, even with ours on.
    fireEvent.compositionStart(field);
    fireEvent.change(field, { target: { value: 'ka' } });
    expect(field.value).toBe('ka');
  });
});

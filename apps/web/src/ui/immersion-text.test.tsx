import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  GlossedRun,
  type GlossWord,
  glossPieces,
  ImmersionSummary,
  type ImmersionView,
  placedWords,
} from './immersion-text.tsx';

const EIKYOU = { surface: '影響', reading: 'えいきょう', verified: true, gloss: 'influence' };

describe('GlossedRun (M2)', () => {
  const at = (start: number, word: GlossWord) => ({
    start,
    end: start + word.surface.length,
    word,
  });

  it('splits a run at the tokenizer offsets of the placed words', () => {
    const matsu = { surface: '待つ', verified: true };
    expect(glossPieces('駅で待つ。', [at(2, matsu)]).map((p) => p.text)).toEqual([
      '駅で',
      '待つ',
      '。',
    ]);
    expect(glossPieces('駅', [])).toEqual([{ text: '駅', at: 0 }]);
    // A run that starts at 3 in its prose: the word at 5 is at 2 in the run.
    expect(glossPieces('駅で待つ', [at(5, matsu)], 3).map((p) => p.text)).toEqual(['駅で', '待つ']);
  });

  it('never puts furigana on a word only found by substring (Issue 34)', () => {
    const hi = { surface: '日', reading: 'ひ', verified: true };
    const view: ImmersionView = {
      mode: 'japanese',
      words: [hi],
      texts: ['毎日、日が出る。'],
      places: [{ text: 0, start: 3, end: 4, word: 0 }],
      fellBack: false,
    };
    const placed = placedWords(view, '毎日、日が出る。');
    expect(placed).toEqual([at(3, hi)]);
    expect(glossPieces('毎日、日が出る。', placed).map((p) => p.text)).toEqual([
      '毎日、',
      '日',
      'が出る。',
    ]);
    const { container } = render(<GlossedRun text="毎日、日が出る。" offset={0} placed={placed} />);
    expect(container.querySelectorAll('rt')).toHaveLength(1);
    expect(container.textContent).toMatch(/^毎日、/);
    expect(placedWords(view, '毎日が楽しい。')).toEqual([]);
    expect(placedWords({ ...view, places: [] }, '毎日、日が出る。')).toEqual([]);
  });

  it('puts furigana over an unknown word and opens its meaning on tap', async () => {
    const { container } = render(
      <GlossedRun text="駅で影響を待つ。" offset={0} placed={[at(2, EIKYOU)]} />,
    );
    expect(container.querySelector('rt')?.textContent).toBe('えいきょう');
    const word = screen.getByRole('button', { name: /^影響\s*\(?えいきょう\)?\s*: meaning$/ });
    expect(word.getAttribute('aria-expanded')).toBe('false');
    await userEvent.click(word);
    expect(screen.getByRole('status').textContent).toBe('influence');
  });

  it('marks an unconfirmed reading, and shows no furigana for a hidden one', async () => {
    const { container, rerender } = render(
      <GlossedRun text="影響" offset={0} placed={[at(0, { ...EIKYOU, verified: false })]} />,
    );
    expect(container.querySelector('rt')?.className).toMatch(/unverified/);
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('status').textContent).toContain('reading not confirmed');
    rerender(
      <GlossedRun text="影響" offset={0} placed={[at(0, { surface: '影響', verified: false })]} />,
    );
    expect(container.querySelector('rt')).toBeNull();
  });
});

describe('ImmersionSummary (M2)', () => {
  const base: ImmersionView = {
    mode: 'japanese',
    words: [],
    fellBack: false,
    summaryNative: 'Wait.',
  };

  it('keeps the summary one tap away in Japanese mode', async () => {
    render(<ImmersionSummary view={base} />);
    expect(screen.queryByText('Wait.')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'In my language' }));
    expect(screen.getByText('Wait.')).toBeTruthy();
  });

  it('shows it at once in mixed mode, and marks a fallback', () => {
    const { rerender } = render(<ImmersionSummary view={{ ...base, mode: 'mixed' }} />);
    expect(screen.getByText('Wait.')).toBeTruthy();
    rerender(<ImmersionSummary view={{ ...base, fellBack: true }} />);
    expect(screen.getByText(/Many words here are new for you/)).toBeTruthy();
    expect(screen.getByText('Wait.')).toBeTruthy();
  });

  it('says so on a fallback without a summary, and shows nothing otherwise', () => {
    const { container, rerender } = render(
      <ImmersionSummary view={{ mode: 'japanese', words: [], fellBack: false }} />,
    );
    expect(container.textContent).toBe('');
    rerender(<ImmersionSummary view={{ mode: 'japanese', words: [], fellBack: true }} />);
    expect(screen.getByText(/Many words here are new/)).toBeTruthy();
  });
});

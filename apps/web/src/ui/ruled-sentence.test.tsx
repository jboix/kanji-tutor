import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { READ_SENTENCE } from './dev-gallery-data.ts';
import { RuledSentence } from './ruled-sentence.tsx';

describe('RuledSentence', () => {
  it('renders the whole sentence as Japanese text', () => {
    const { container } = render(<RuledSentence sentence={READ_SENTENCE} />);
    const p = container.querySelector('p');
    expect(p?.getAttribute('lang')).toBe('ja');
    expect(p?.textContent).toBe('駅で友達を待っている間に、本を読みました。');
  });

  it('calls onTokenTap with the token index, by pointer and by keyboard', async () => {
    const onTap = vi.fn();
    render(<RuledSentence sentence={READ_SENTENCE} onTokenTap={onTap} />);
    await userEvent.click(screen.getByRole('button', { name: '間' }));
    expect(onTap).toHaveBeenLastCalledWith(7);
    screen.getByRole('button', { name: '友達' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onTap).toHaveBeenLastCalledWith(2);
  });

  it('does not make punctuation tappable by default', () => {
    render(<RuledSentence sentence={READ_SENTENCE} onTokenTap={vi.fn()} />);
    expect(screen.queryByRole('button', { name: '、' })).toBeNull();
    expect(screen.getAllByRole('button')).toHaveLength(14);
  });

  it('renders no buttons without a tap handler', () => {
    render(<RuledSentence sentence={READ_SENTENCE} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('shows furigana only on the tokens it is asked to, over the kanji only', () => {
    const { container } = render(<RuledSentence sentence={READ_SENTENCE} furigana={[4]} />);
    const readings = Array.from(container.querySelectorAll('rt')).map((rt) => rt.textContent);
    expect(readings).toEqual(['ま']);
    expect(container.querySelector('ruby')?.firstChild?.textContent).toBe('待');
    expect(container.querySelector('p')?.textContent).toContain('待(ま)っ');
  });

  it('shows no furigana when none is asked for', () => {
    const { container } = render(<RuledSentence sentence={READ_SENTENCE} />);
    expect(container.querySelectorAll('rt')).toHaveLength(0);
  });

  it('keeps furigana inside a tappable token, named by what it shows (WCAG 2.5.3)', async () => {
    const onTap = vi.fn();
    render(<RuledSentence sentence={READ_SENTENCE} furigana={[4]} onTokenTap={onTap} />);
    const button = screen.getByRole('button', { name: /^待\s*\(?ま\)?\s*っ$/ });
    expect(button.querySelector('rt')?.textContent).toBe('ま');
    await userEvent.click(button);
    expect(onTap).toHaveBeenCalledWith(4);
  });

  it('inserts a correction caret before the given token', () => {
    const { container } = render(
      <RuledSentence sentence={READ_SENTENCE} insertions={[{ before: 1, text: 'に' }]} />,
    );
    const rt = container.querySelector('rt');
    expect(rt?.textContent).toBe('Insert: に');
  });
});

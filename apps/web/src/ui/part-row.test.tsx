import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { PartList, PartRow } from './part-row.tsx';

describe('PartRow and PartList', () => {
  it('lists the parts with their names, Japanese samples and counts', () => {
    render(
      <MemoryRouter>
        <PartList label="Parts">
          <PartRow to="/kanji" name="Kanji" sample="雨 晴 雪" count={{ done: 2, total: 5 }} />
          <PartRow to="/grammar" name="Grammar" detail="Each point explained" aside="Done" />
        </PartList>
      </MemoryRouter>,
    );
    const parts = screen.getByRole('region', { name: 'Parts' });
    const [kanji, grammar] = within(parts).getAllByRole('link');
    expect(kanji?.getAttribute('href')).toBe('/kanji');
    expect(kanji?.textContent).toBe('Kanji雨 晴 雪2 of 5');
    expect(within(parts).getByText('雨 晴 雪').getAttribute('lang')).toBe('ja');
    expect(grammar?.textContent).toBe('GrammarEach point explainedDone');
  });

  it('is a button without a route', async () => {
    const open = vi.fn();
    render(<PartRow name="Words" onClick={open} current />);
    await userEvent.click(screen.getByRole('button', { name: 'Words' }));
    expect(open).toHaveBeenCalledOnce();
  });
});

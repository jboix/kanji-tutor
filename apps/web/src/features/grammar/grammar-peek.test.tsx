import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { grammarRepos } from '../../test/grammar-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { PeekProvider } from '../../ui/peek-link.tsx';
import type { PointPracticeSlotProps } from '../../ui/slots.tsx';
import { GrammarPeek } from './grammar-peek.tsx';

const pointPractice = ({ grammarId }: PointPracticeSlotProps) => <p>drills of {grammarId}</p>;

async function render(inSession: boolean) {
  const services = fakeServices({ repos: await grammarRepos() });
  const page = <GrammarPeek id="te-mo-ii" />;
  renderWithServices(inSession ? <PeekProvider>{page}</PeekProvider> : page, {
    services,
    slots: { pointPractice },
  });
}

describe('grammar page in a sheet (R14)', () => {
  it('practises the point when opened on its own', async () => {
    await render(false);
    expect(screen.getByRole('region', { name: 'Practise this point' })).toBeTruthy();
    expect(screen.getByText('drills of te-mo-ii')).toBeTruthy();
  });

  it('has no practice over a session, which would start one inside it', async () => {
    await render(true);
    expect(screen.getByRole('heading', { level: 1, name: '〜てもいい' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Practise this point' })).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { CAST, castAmong, castOf } from './cast.ts';
import { GRAMMAR_DIALOGUES } from './dialogues/catalogue.ts';
import { unitCast } from './services/unit-cast.ts';

describe('the cast', () => {
  it('names a dialogue speaker who is one of the cast, and no guest', () => {
    expect(castOf('ユキ')?.id).toBe('yuki');
    expect(castOf('森')?.name).toBe('Mori-san');
    expect(castOf('リン')).toBeUndefined();
  });

  it('lists the cast among speakers once each, in cast order', () => {
    expect(castAmong(['ケン', 'リン', 'ユキ', 'ケン']).map((m) => m.id)).toEqual(['yuki', 'ken']);
  });

  it('meets Yuki and Ken as friends in plain Japanese in the dialogues', () => {
    const friends = GRAMMAR_DIALOGUES.flatMap((set) => set.dialogues).filter((d) =>
      d.speakers.includes('ユキ'),
    );
    expect(friends.length).toBeGreaterThan(0);
    for (const d of friends) expect([d.setting, d.register]).toEqual(['friends', 'plain']);
    expect(CAST.map((m) => m.speaker)).toEqual(['ユキ', 'ケン', '森']);
  });

  it("finds a unit's cast in the dialogues of its grammar points", async () => {
    expect((await unitCast({ id: 'none', grammar: ['koto-ni-suru'] })).map((m) => m.id)).toEqual([
      'yuki',
      'ken',
    ]);
    expect(await unitCast({ id: 'none', grammar: ['koto-ni-naru'] })).toEqual([]);
    expect(await unitCast({ id: 'none', grammar: [] })).toEqual([]);
  });
});

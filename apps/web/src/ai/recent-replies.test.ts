import { describe, expect, it } from 'vitest';
import { keepReply, recentReplies } from './recent-replies.ts';

describe('recent replies', () => {
  it('keeps the last ten, each cut to 20,000 characters', () => {
    for (let i = 0; i < 12; i++) {
      keepReply({ at: i, task: 'explainWord', model: 'm', ok: true, text: 'x'.repeat(30_000) });
    }
    const kept = recentReplies();
    expect(kept.map((reply) => reply.at)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(kept[0]?.text).toHaveLength(20_000);
  });
});

import { describe, expect, it } from 'vitest';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import { collectDiagnostics, diagnosticsFileName, diagnosticsText } from './diagnostics.ts';

describe('diagnostics', () => {
  it('lists the tutor’s requests with timings and errors, and the app’s errors', async () => {
    localStorage.setItem(
      'kanji-reader:errors',
      JSON.stringify([{ at: 0, where: 'screen', message: 'TypeError: x', stack: 'at f\nat g' }]),
    );
    const repos = createMemoryRepos({ settings: { apiKey: 'k', learnerLevel: 4 } });
    const base = { model: 'flash', inputTokens: 700, outputTokens: 200, at: 1_000 };
    await repos.aiLog.add({ ...base, task: 'explainWord', cached: false, ok: true, ms: 3_200 });
    await repos.aiLog.add({
      ...base,
      task: 'readSign',
      cached: false,
      ok: false,
      error: 'timeout: slow',
    });
    const report = await collectDiagnostics(repos, 2_000);
    expect(report.settings.apiKey).toBe('set');
    const text = diagnosticsText(report);
    expect(text).toContain('N4, key set, models');
    expect(text).toContain('explainWord flash ok 3.2 s 700→200 tokens');
    expect(text).toContain('readSign flash failed (timeout: slow) 700→200 tokens');
    expect(text).toContain('[screen] TypeError: x\n      at f\n      at g');
    expect(text).toContain('Stored: 0 items, 0 scanned lessons, 0 photos, 0 notes');
  });

  it('names the file by its UTC minute', () => {
    expect(diagnosticsFileName(Date.UTC(2026, 9, 27, 8, 5))).toBe(
      'kanji-tutor-diagnostics-2026-10-27-0805.json',
    );
  });
});

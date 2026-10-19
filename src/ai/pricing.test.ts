import { describe, expect, it } from 'vitest';
import { estimateCostUsd, MODEL_CHOICES, PRICES, priceFor } from './pricing.ts';

const OCT_2026 = Date.UTC(2026, 9, 18);
const JAN_2027 = Date.UTC(2027, 0, 1);

describe('priceFor', () => {
  it('prices Gemini 3.8 Flash and 3.6 Flash at the launch rate until 2026-12-31', () => {
    for (const model of ['gemini-3.8-flash', 'gemini-3.6-flash']) {
      expect(priceFor(model, OCT_2026)).toEqual({ input: 0.75, output: 3.75, cachedInput: 0.075 });
      expect(priceFor(model, JAN_2027 - 1)).toEqual({
        input: 0.75,
        output: 3.75,
        cachedInput: 0.075,
      });
      expect(priceFor(model, JAN_2027)).toEqual({ input: 1.5, output: 7.5, cachedInput: 0.15 });
    }
  });

  it('keeps the flat prices and the retired 2.5 models', () => {
    expect(priceFor('gemini-3.5-flash-lite', OCT_2026)).toEqual({
      input: 0.3,
      output: 2.5,
      cachedInput: 0.03,
    });
    expect(priceFor('gemini-3.1-flash-lite', JAN_2027)).toEqual({
      input: 0.25,
      output: 1.5,
      cachedInput: 0.025,
    });
    expect(priceFor('gemini-2.5-flash-lite', OCT_2026)).toEqual({
      input: 0.1,
      output: 0.4,
      cachedInput: 0.01,
    });
    expect(priceFor('gemini-9-custom', OCT_2026)).toBeUndefined();
  });

  it('offers only priced models as choices', () => {
    for (const model of MODEL_CHOICES) expect(PRICES[model]).toBeDefined();
  });
});

describe('estimateCostUsd', () => {
  it('uses the price in force at the time of the call', () => {
    expect(estimateCostUsd('gemini-3.8-flash', 1_000_000, 1_000_000, OCT_2026)).toBeCloseTo(4.5);
    expect(estimateCostUsd('gemini-3.8-flash', 1_000_000, 1_000_000, JAN_2027)).toBeCloseTo(9);
  });

  it('prices implicitly cached prompt tokens at the cached rate (A15)', () => {
    // 1M in, of which 600k cached, on 3.5 Flash-Lite: 400k × 0.30 + 600k × 0.03 = 0.138.
    expect(estimateCostUsd('gemini-3.5-flash-lite', 1_000_000, 0, OCT_2026, 600_000)).toBeCloseTo(
      0.138,
    );
    expect(estimateCostUsd('gemini-3.8-flash', 1_000_000, 0, OCT_2026, 1_000_000)).toBeCloseTo(
      0.075,
    );
    expect(estimateCostUsd('gemini-3.8-flash', 1_000_000, 0, JAN_2027, 1_000_000)).toBeCloseTo(
      0.15,
    );
    expect(estimateCostUsd('gemini-3.1-flash-lite', 1_000_000, 0, OCT_2026, 1_000_000)).toBeCloseTo(
      0.025,
    );
    // Never more cached tokens than input tokens.
    expect(estimateCostUsd('gemini-3.5-flash-lite', 10, 0, OCT_2026, 99)).toBeCloseTo(3e-7);
  });

  it('estimates unknown models at the fast default price', () => {
    expect(estimateCostUsd('custom', 1_000_000, 0, OCT_2026)).toBeCloseTo(0.3);
  });
});

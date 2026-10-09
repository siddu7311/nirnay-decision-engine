// ============================================================
// NIRNAY — Normalization Tests
// ============================================================
import { describe, it, expect } from 'vitest';
import { normalizeValue, normalizeAll, buildNormalizationContexts } from './normalization';
import type { Criterion } from '../types/decision';

const hiCrit: Criterion = { id: 'c1', name: 'Score', description: '', unit: '', direction: 'higher_is_better' };
const loCrit: Criterion = { id: 'c2', name: 'Cost', description: '', unit: '', direction: 'lower_is_better' };

// ---- normalizeValue ----

describe('normalizeValue', () => {
  it('higher_is_better: min value gets 0', () => {
    const ctx = { criterionId: 'c1', min: 10, max: 20, direction: 'higher_is_better' as const };
    expect(normalizeValue(10, ctx)).toBe(0);
  });

  it('higher_is_better: max value gets 100', () => {
    const ctx = { criterionId: 'c1', min: 10, max: 20, direction: 'higher_is_better' as const };
    expect(normalizeValue(20, ctx)).toBe(100);
  });

  it('higher_is_better: midpoint gets 50', () => {
    const ctx = { criterionId: 'c1', min: 0, max: 100, direction: 'higher_is_better' as const };
    expect(normalizeValue(50, ctx)).toBe(50);
  });

  it('lower_is_better: min value gets 100', () => {
    const ctx = { criterionId: 'c2', min: 10, max: 20, direction: 'lower_is_better' as const };
    expect(normalizeValue(10, ctx)).toBe(100);
  });

  it('lower_is_better: max value gets 0', () => {
    const ctx = { criterionId: 'c2', min: 10, max: 20, direction: 'lower_is_better' as const };
    expect(normalizeValue(20, ctx)).toBe(0);
  });

  it('lower_is_better: midpoint gets 50', () => {
    const ctx = { criterionId: 'c2', min: 0, max: 100, direction: 'lower_is_better' as const };
    expect(normalizeValue(50, ctx)).toBe(50);
  });

  it('all equal values (max === min) → returns 100', () => {
    const ctx = { criterionId: 'c1', min: 50, max: 50, direction: 'higher_is_better' as const };
    expect(normalizeValue(50, ctx)).toBe(100);
  });

  it('three values, higher_is_better: [0, 50, 100] → [0, 50, 100]', () => {
    const ctx = { criterionId: 'c1', min: 0, max: 100, direction: 'higher_is_better' as const };
    expect(normalizeValue(0,   ctx)).toBe(0);
    expect(normalizeValue(50,  ctx)).toBe(50);
    expect(normalizeValue(100, ctx)).toBe(100);
  });

  it('three values, lower_is_better: [0, 50, 100] → [100, 50, 0]', () => {
    const ctx = { criterionId: 'c2', min: 0, max: 100, direction: 'lower_is_better' as const };
    expect(normalizeValue(0,   ctx)).toBe(100);
    expect(normalizeValue(50,  ctx)).toBe(50);
    expect(normalizeValue(100, ctx)).toBe(0);
  });
});

// ---- buildNormalizationContexts ----

describe('buildNormalizationContexts', () => {
  it('correctly computes min/max across feasible alternatives', () => {
    const values: Record<string, Record<string, number>> = {
      a1: { c1: 10 },
      a2: { c1: 30 },
    };
    const ctxs = buildNormalizationContexts([hiCrit], values, ['a1', 'a2']);
    expect(ctxs[0].min).toBe(10);
    expect(ctxs[0].max).toBe(30);
  });

  it('ignores infeasible alternatives not in feasibleIds', () => {
    const values: Record<string, Record<string, number>> = {
      a1: { c1: 10 },
      a2: { c1: 30 },
      infeasible: { c1: 1000 }, // should be ignored
    };
    const ctxs = buildNormalizationContexts([hiCrit], values, ['a1', 'a2']);
    expect(ctxs[0].max).toBe(30);
  });

  it('handles single feasible alternative (min === max)', () => {
    const values: Record<string, Record<string, number>> = { a1: { c1: 42 } };
    const ctxs = buildNormalizationContexts([hiCrit], values, ['a1']);
    expect(ctxs[0].min).toBe(42);
    expect(ctxs[0].max).toBe(42);
  });
});

// ---- normalizeAll ----

describe('normalizeAll', () => {
  it('produces correct normalized matrix for two alternatives', () => {
    const criteria: Criterion[] = [hiCrit, loCrit];
    const values: Record<string, Record<string, number>> = {
      a1: { c1: 10, c2: 20 },
      a2: { c1: 30, c2: 10 },
    };
    const result = normalizeAll(criteria, values, ['a1', 'a2']);

    // c1 (higher better): a1=10→0, a2=30→100
    expect(result['a1']['c1']).toBeCloseTo(0, 5);
    expect(result['a2']['c1']).toBeCloseTo(100, 5);

    // c2 (lower better): a1=20→0, a2=10→100
    expect(result['a1']['c2']).toBeCloseTo(0, 5);
    expect(result['a2']['c2']).toBeCloseTo(100, 5);
  });

  it('all equal values get score 100', () => {
    const values: Record<string, Record<string, number>> = {
      a1: { c1: 50 },
      a2: { c1: 50 },
    };
    const result = normalizeAll([hiCrit], values, ['a1', 'a2']);
    expect(result['a1']['c1']).toBe(100);
    expect(result['a2']['c1']).toBe(100);
  });

  it('single alternative gets score 100', () => {
    const values: Record<string, Record<string, number>> = { a1: { c1: 30 } };
    const result = normalizeAll([hiCrit], values, ['a1']);
    expect(result['a1']['c1']).toBe(100);
  });

  it('missing value defaults to 0', () => {
    const values: Record<string, Record<string, number>> = {
      a1: { c1: 50 },
      a2: {},  // c1 missing → treated as 0
    };
    const result = normalizeAll([hiCrit], values, ['a1', 'a2']);
    expect(result['a2']['c1']).toBeCloseTo(0, 5);
  });
});

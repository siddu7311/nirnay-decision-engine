// ============================================================
// NIRNAY — Decision Engine Tests
// ============================================================
import { describe, it, expect } from 'vitest';
import { runDecisionEngine, runWhatIf } from './decisionEngine';
import type { DecisionInput } from '../types/decision';

// ---- Shared demo input (Food Delivery) ----
const DEMO_INPUT: DecisionInput = {
  alternatives: [
    { id: 'alt-a', name: 'Option A', description: 'Budget-friendly' },
    { id: 'alt-b', name: 'Option B', description: 'Premium' },
    { id: 'alt-c', name: 'Option C', description: 'Cheap but slow' },
  ],
  criteria: [
    { id: 'crit-price',  name: 'Price',         description: '', unit: '₹',   direction: 'lower_is_better' },
    { id: 'crit-time',   name: 'Delivery Time',  description: '', unit: 'min', direction: 'lower_is_better' },
    { id: 'crit-rating', name: 'Rating',         description: '', unit: '/5',  direction: 'higher_is_better' },
  ],
  weights: [
    { criterionId: 'crit-price',  weight: 50 },
    { criterionId: 'crit-time',   weight: 30 },
    { criterionId: 'crit-rating', weight: 20 },
  ],
  constraints: [
    { id: 'con-1', criterionId: 'crit-time', operator: '<=', value: 40 },
  ],
  values: {
    'alt-a': { 'crit-price': 100, 'crit-time': 30, 'crit-rating': 4.2 },
    'alt-b': { 'crit-price': 150, 'crit-time': 20, 'crit-rating': 4.8 },
    'alt-c': { 'crit-price': 80,  'crit-time': 45, 'crit-rating': 4.0 },
  },
};

// ---- No-constraint input ----
const NO_CONSTRAINT_INPUT: DecisionInput = { ...DEMO_INPUT, constraints: [] };

// ---- Determinism ----

describe('determinism', () => {
  it('produces identical results on repeated calls with the same input', () => {
    const r1 = runDecisionEngine(DEMO_INPUT);
    const r2 = runDecisionEngine(DEMO_INPUT);
    expect(r1.recommendation?.alternative.name).toBe(r2.recommendation?.alternative.name);
    expect(r1.recommendation?.totalScore).toBe(r2.recommendation?.totalScore);
    expect(r1.isTie).toBe(r2.isTie);
  });
});

// ---- Constraint filtering ----

describe('constraint filtering', () => {
  it('excludes Option C (45 min) from feasible set when constraint <= 40', () => {
    const result = runDecisionEngine(DEMO_INPUT);
    const optC = result.rankedResults.find((r) => r.alternative.id === 'alt-c');
    expect(optC?.feasible).toBe(false);
    expect(optC?.rank).toBeNull();
  });

  it('Options A and B are feasible', () => {
    const result = runDecisionEngine(DEMO_INPUT);
    const a = result.rankedResults.find((r) => r.alternative.id === 'alt-a');
    const b = result.rankedResults.find((r) => r.alternative.id === 'alt-b');
    expect(a?.feasible).toBe(true);
    expect(b?.feasible).toBe(true);
  });

  it('noFeasibleOption is true when all alternatives violate constraints', () => {
    const input: DecisionInput = {
      ...DEMO_INPUT,
      constraints: [{ id: 'con-x', criterionId: 'crit-time', operator: '<=', value: 5 }],
    };
    const result = runDecisionEngine(input);
    expect(result.noFeasibleOption).toBe(true);
    expect(result.recommendation).toBeNull();
    expect(result.rankedResults.every((r) => !r.feasible)).toBe(true);
  });

  it('all alternatives feasible when no constraints', () => {
    const result = runDecisionEngine(NO_CONSTRAINT_INPUT);
    expect(result.noFeasibleOption).toBe(false);
    expect(result.rankedResults.every((r) => r.feasible)).toBe(true);
  });
});

// ---- Scoring ----

describe('weighted scoring', () => {
  it('single criterion at 100% weight: winner has highest raw score (higher_is_better)', () => {
    const input: DecisionInput = {
      alternatives: [
        { id: 'a1', name: 'A', description: '' },
        { id: 'a2', name: 'B', description: '' },
      ],
      criteria: [
        { id: 'c1', name: 'Score', description: '', unit: '', direction: 'higher_is_better' },
      ],
      weights: [{ criterionId: 'c1', weight: 100 }],
      constraints: [],
      values: { a1: { c1: 80 }, a2: { c1: 60 } },
    };
    const result = runDecisionEngine(input);
    expect(result.recommendation?.alternative.id).toBe('a1');
    expect(result.recommendation?.totalScore).toBeCloseTo(100, 1);
  });

  it('zero-weight criterion contributes nothing to total', () => {
    const input: DecisionInput = {
      alternatives: [
        { id: 'a1', name: 'A', description: '' },
        { id: 'a2', name: 'B', description: '' },
      ],
      criteria: [
        { id: 'c1', name: 'Price',  description: '', unit: '', direction: 'lower_is_better' },
        { id: 'c2', name: 'Unused', description: '', unit: '', direction: 'higher_is_better' },
      ],
      weights: [
        { criterionId: 'c1', weight: 100 },
        { criterionId: 'c2', weight: 0 },
      ],
      constraints: [],
      values: {
        a1: { c1: 10, c2: 1 },   // lowest price, worst unused
        a2: { c1: 20, c2: 100 }, // higher price, best unused
      },
    };
    const result = runDecisionEngine(input);
    expect(result.recommendation?.alternative.id).toBe('a1'); // price wins
    expect(result.recommendation?.weightedContributions['c2']).toBeCloseTo(0, 5);
  });

  it('equal weights, equal normalized scores → score is 100', () => {
    const input: DecisionInput = {
      alternatives: [{ id: 'a1', name: 'A', description: '' }],
      criteria: [
        { id: 'c1', name: 'X', description: '', unit: '', direction: 'higher_is_better' },
        { id: 'c2', name: 'Y', description: '', unit: '', direction: 'higher_is_better' },
        { id: 'c3', name: 'Z', description: '', unit: '', direction: 'higher_is_better' },
      ],
      weights: [
        { criterionId: 'c1', weight: 34 },
        { criterionId: 'c2', weight: 33 },
        { criterionId: 'c3', weight: 33 },
      ],
      constraints: [],
      values: { a1: { c1: 50, c2: 50, c3: 50 } }, // single alt → all normalized = 100
    };
    const result = runDecisionEngine(input);
    expect(result.recommendation?.totalScore).toBeCloseTo(100, 5);
  });

  it('all equal criterion values → all alternatives get same score', () => {
    const input: DecisionInput = {
      alternatives: [
        { id: 'a1', name: 'A', description: '' },
        { id: 'a2', name: 'B', description: '' },
      ],
      criteria: [
        { id: 'c1', name: 'X', description: '', unit: '', direction: 'higher_is_better' },
      ],
      weights: [{ criterionId: 'c1', weight: 100 }],
      constraints: [],
      values: { a1: { c1: 50 }, a2: { c1: 50 } },
    };
    const result = runDecisionEngine(input);
    expect(result.isTie).toBe(true);
    expect(result.recommendation).toBeNull();
    const scores = result.tiedAlternatives.map((r) => r.totalScore);
    expect(scores[0]).toBeCloseTo(scores[1], 5);
  });
});

// ---- Ranking ----

describe('ranking', () => {
  it('assigns rank 1 to the highest-scoring feasible alternative', () => {
    const result = runDecisionEngine(DEMO_INPUT);
    const ranked = result.rankedResults.filter((r) => r.feasible).sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
    expect(ranked[0].rank).toBe(1);
  });

  it('3 distinct scores → ranks are 1, 2, 3', () => {
    const input: DecisionInput = {
      alternatives: [
        { id: 'a1', name: 'A', description: '' },
        { id: 'a2', name: 'B', description: '' },
        { id: 'a3', name: 'C', description: '' },
      ],
      criteria: [{ id: 'c1', name: 'X', description: '', unit: '', direction: 'higher_is_better' }],
      weights: [{ criterionId: 'c1', weight: 100 }],
      constraints: [],
      values: { a1: { c1: 90 }, a2: { c1: 60 }, a3: { c1: 30 } },
    };
    const result = runDecisionEngine(input);
    const ranks = result.rankedResults
      .filter((r) => r.feasible)
      .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
      .map((r) => r.rank);
    expect(ranks).toEqual([1, 2, 3]);
  });

  it('two alternatives within tie tolerance share rank 1', () => {
    const input: DecisionInput = {
      alternatives: [
        { id: 'a1', name: 'A', description: '' },
        { id: 'a2', name: 'B', description: '' },
      ],
      criteria: [
        { id: 'c1', name: 'X', description: '', unit: '', direction: 'higher_is_better' },
        { id: 'c2', name: 'Y', description: '', unit: '', direction: 'lower_is_better' },
      ],
      weights: [
        { criterionId: 'c1', weight: 50 },
        { criterionId: 'c2', weight: 50 },
      ],
      constraints: [],
      // Both get equal scores: a1 wins c1 perfectly, a2 wins c2 perfectly
      values: {
        a1: { c1: 100, c2: 100 }, // c1 norm=100, c2 norm=0 → 50
        a2: { c1: 0,   c2: 0   }, // c1 norm=0,   c2 norm=100 → 50
      },
    };
    const result = runDecisionEngine(input);
    expect(result.isTie).toBe(true);
    expect(result.tiedAlternatives).toHaveLength(2);
    expect(result.recommendation).toBeNull();
  });

  it('infeasible alternatives have null rank', () => {
    const result = runDecisionEngine(DEMO_INPUT);
    const infeasible = result.rankedResults.filter((r) => !r.feasible);
    expect(infeasible.every((r) => r.rank === null)).toBe(true);
  });

  it('single feasible alternative wins automatically (no tie)', () => {
    const input: DecisionInput = {
      ...DEMO_INPUT,
      // Tight constraint: only B (20 min) survives
      constraints: [{ id: 'con-x', criterionId: 'crit-time', operator: '<=', value: 25 }],
    };
    const result = runDecisionEngine(input);
    expect(result.isTie).toBe(false);
    expect(result.recommendation?.alternative.id).toBe('alt-b');
    expect(result.recommendation?.rank).toBe(1);
  });
});

// ---- Trade-off analysis ----

describe('trade-off analysis', () => {
  it('produces no trade-offs when there is only one feasible alternative', () => {
    const input: DecisionInput = {
      ...DEMO_INPUT,
      constraints: [{ id: 'con-x', criterionId: 'crit-time', operator: '<=', value: 25 }],
    };
    const result = runDecisionEngine(input);
    expect(result.tradeOffs).toHaveLength(0);
  });

  it('trade-off lists use criterion names, not IDs', () => {
    const result = runDecisionEngine(NO_CONSTRAINT_INPUT);
    for (const tradeOff of result.tradeOffs) {
      const allNames = [...tradeOff.advantages, ...tradeOff.disadvantages];
      for (const n of allNames) {
        // Names should not look like raw IDs (containing a hyphen prefix like "crit-")
        expect(n).not.toMatch(/^crit-/);
      }
    }
  });
});

// ---- runWhatIf ----

describe('runWhatIf', () => {
  it('returns the same result as runDecisionEngine when weights/constraints are unchanged', () => {
    const base = runDecisionEngine(DEMO_INPUT);
    const whatif = runWhatIf(DEMO_INPUT, DEMO_INPUT.weights, DEMO_INPUT.constraints);
    expect(whatif.recommendation?.alternative.id).toBe(base.recommendation?.alternative.id);
    expect(whatif.isTie).toBe(base.isTie);
    expect(whatif.noFeasibleOption).toBe(base.noFeasibleOption);
    if (base.recommendation && whatif.recommendation) {
      expect(whatif.recommendation.totalScore).toBeCloseTo(base.recommendation.totalScore, 5);
    }
  });

  it('changing constraints can make a previously feasible option infeasible', () => {
    // New constraint: only times ≤ 15 allowed → none of A (30), B (20), C (45) passes... 
    // Actually only B would survive at ≤ 25
    const newConstraints = [{ id: 'con-new', criterionId: 'crit-time', operator: '<=' as const, value: 25 }];
    const result = runWhatIf(DEMO_INPUT, DEMO_INPUT.weights, newConstraints);
    const optA = result.rankedResults.find((r) => r.alternative.id === 'alt-a');
    expect(optA?.feasible).toBe(false);
    expect(result.recommendation?.alternative.id).toBe('alt-b');
  });

  it('does not mutate the original input', () => {
    const originalWeights = JSON.parse(JSON.stringify(DEMO_INPUT.weights));
    const newWeights = DEMO_INPUT.weights.map((w) => ({ ...w, weight: w.weight / 2 }));
    runWhatIf(DEMO_INPUT, newWeights, DEMO_INPUT.constraints);
    expect(DEMO_INPUT.weights).toEqual(originalWeights);
  });
});

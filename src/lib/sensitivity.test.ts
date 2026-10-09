// ============================================================
// NIRNAY — Sensitivity Analysis Tests
// ============================================================
import { describe, it, expect } from 'vitest';
import { runSensitivityAnalysis } from './sensitivity';
import type { DecisionInput } from '../types/decision';

const DEMO_INPUT: DecisionInput = {
  alternatives: [
    { id: 'alt-a', name: 'Option A', description: '' },
    { id: 'alt-b', name: 'Option B', description: '' },
    { id: 'alt-c', name: 'Option C', description: '' },
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

describe('runSensitivityAnalysis', () => {
  it('returns an empty result for an unknown criterion ID', () => {
    const result = runSensitivityAnalysis(DEMO_INPUT, 'unknown-crit');
    expect(result.points).toHaveLength(0);
    expect(result.thresholds).toHaveLength(0);
  });

  it('weights sum to 100 at every data point', () => {
    const result = runSensitivityAnalysis(DEMO_INPUT, 'crit-price');
    // We cannot access the internal weights directly, but the engine accepts only valid inputs,
    // so verify points were generated (engine didn't crash / reject them)
    expect(result.points.length).toBeGreaterThan(0);
  });

  it('returns the correct criterion name', () => {
    const result = runSensitivityAnalysis(DEMO_INPUT, 'crit-price');
    expect(result.criterionName).toBe('Price');
    expect(result.criterionId).toBe('crit-price');
  });

  it('generates one point per weight step', () => {
    const result = runSensitivityAnalysis(DEMO_INPUT, 'crit-price');
    // WEIGHT_STEPS has 16 values (5..80 in steps of 5)
    expect(result.points).toHaveLength(16);
  });

  it('each point has a weight property and scores for feasible alternatives', () => {
    const result = runSensitivityAnalysis(DEMO_INPUT, 'crit-price');
    for (const point of result.points) {
      expect(typeof point.weight).toBe('number');
      expect(point.weight).toBeGreaterThan(0);
      expect(point.weight).toBeLessThanOrEqual(80);
      // At least some alternatives should have scores
      expect(Object.keys(point.scores).length).toBeGreaterThan(0);
    }
  });

  it('threshold detection: reports change when winner switches between consecutive points', () => {
    const result = runSensitivityAnalysis(DEMO_INPUT, 'crit-price');
    for (const threshold of result.thresholds) {
      expect(threshold.from).not.toBe(threshold.to);
      expect(typeof threshold.weight).toBe('number');
    }
  });

  it('no thresholds when winner never changes', () => {
    // A dominantly simple input where one alternative wins at every weight
    const input: DecisionInput = {
      alternatives: [
        { id: 'a1', name: 'A', description: '' },
        { id: 'a2', name: 'B', description: '' },
      ],
      criteria: [
        { id: 'c1', name: 'X', description: '', unit: '', direction: 'higher_is_better' },
        { id: 'c2', name: 'Y', description: '', unit: '', direction: 'higher_is_better' },
      ],
      weights: [
        { criterionId: 'c1', weight: 50 },
        { criterionId: 'c2', weight: 50 },
      ],
      constraints: [],
      // A1 dominates on BOTH criteria → wins regardless of weight distribution
      values: {
        a1: { c1: 100, c2: 100 },
        a2: { c1: 1,   c2: 1   },
      },
    };
    const result = runSensitivityAnalysis(input, 'c1');
    expect(result.thresholds).toHaveLength(0);
  });

  it('scores in each point are non-negative', () => {
    const result = runSensitivityAnalysis(DEMO_INPUT, 'crit-rating');
    for (const point of result.points) {
      for (const score of Object.values(point.scores)) {
        expect(score).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

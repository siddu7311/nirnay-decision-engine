// ============================================================
// NIRNAY — Constraint Tests
// ============================================================
import { describe, it, expect } from 'vitest';
import { evaluateOperator, formatViolation, filterFeasibility } from './constraints';
import type { Alternative, Constraint } from '../types/decision';

// ---- evaluateOperator ----

describe('evaluateOperator', () => {
  it('< passes when actual is less', () => expect(evaluateOperator(150, '<', 200)).toBe(true));
  it('< fails when actual equals threshold', () => expect(evaluateOperator(200, '<', 200)).toBe(false));
  it('< fails when actual is greater', () => expect(evaluateOperator(250, '<', 200)).toBe(false));

  it('<= passes when actual equals threshold', () => expect(evaluateOperator(40, '<=', 40)).toBe(true));
  it('<= passes when actual is less', () => expect(evaluateOperator(35, '<=', 40)).toBe(true));
  it('<= fails when actual exceeds threshold', () => expect(evaluateOperator(45, '<=', 40)).toBe(false));

  it('= passes when equal', () => expect(evaluateOperator(100, '=', 100)).toBe(true));
  it('= fails when not equal', () => expect(evaluateOperator(99, '=', 100)).toBe(false));
  it('= passes with floating-point equality within 1e-9', () => expect(evaluateOperator(1.0000000001, '=', 1)).toBe(true));

  it('>= passes when actual equals threshold', () => expect(evaluateOperator(4.0, '>=', 4.0)).toBe(true));
  it('>= passes when actual is greater', () => expect(evaluateOperator(4.2, '>=', 4.0)).toBe(true));
  it('>= fails when actual is less', () => expect(evaluateOperator(3.8, '>=', 4.0)).toBe(false));

  it('> passes when strictly greater', () => expect(evaluateOperator(201, '>', 200)).toBe(true));
  it('> fails when equal', () => expect(evaluateOperator(200, '>', 200)).toBe(false));
  it('> fails when less', () => expect(evaluateOperator(199, '>', 200)).toBe(false));
});

// ---- formatViolation ----

describe('formatViolation', () => {
  it('includes the actual value and threshold', () => {
    const msg = formatViolation('Delivery Time', 'min', 45, '<=', 40);
    expect(msg).toContain('45');
    expect(msg).toContain('40');
    expect(msg).toContain('Delivery Time');
  });

  it('uses unit in message', () => {
    const msg = formatViolation('Price', '₹', 150, '<=', 100);
    expect(msg).toContain('₹');
  });

  it('works without a unit', () => {
    const msg = formatViolation('Score', '', 90, '>=', 95);
    expect(msg).not.toContain('undefined');
  });
});

// ---- filterFeasibility ----

const criteriaMap = {
  'c-time': { name: 'Delivery Time', unit: 'min', direction: 'lower_is_better' as const },
  'c-price': { name: 'Price', unit: '₹', direction: 'lower_is_better' as const },
  'c-rating': { name: 'Rating', unit: '/5', direction: 'higher_is_better' as const },
};

const alternatives: Alternative[] = [
  { id: 'a1', name: 'Option A', description: '' },
  { id: 'a2', name: 'Option B', description: '' },
  { id: 'a3', name: 'Option C', description: '' },
];

const values: Record<string, Record<string, number>> = {
  a1: { 'c-time': 30, 'c-price': 100, 'c-rating': 4.2 },
  a2: { 'c-time': 20, 'c-price': 150, 'c-rating': 4.8 },
  a3: { 'c-time': 45, 'c-price': 80,  'c-rating': 4.0 },
};

describe('filterFeasibility', () => {
  it('all feasible when no constraints', () => {
    const result = filterFeasibility(alternatives, [], values, criteriaMap);
    expect(result['a1']).toHaveLength(0);
    expect(result['a2']).toHaveLength(0);
    expect(result['a3']).toHaveLength(0);
  });

  it('constraint <= 40 min: a3 (45 min) is infeasible', () => {
    const constraints: Constraint[] = [
      { id: 'con1', criterionId: 'c-time', operator: '<=', value: 40 },
    ];
    const result = filterFeasibility(alternatives, constraints, values, criteriaMap);
    expect(result['a1']).toHaveLength(0);  // 30 ≤ 40 ✓
    expect(result['a2']).toHaveLength(0);  // 20 ≤ 40 ✓
    expect(result['a3']).toHaveLength(1);  // 45 > 40 ✗
    expect(result['a3'][0].actualValue).toBe(45);
    expect(result['a3'][0].message).toContain('45');
  });

  it('boundary: value exactly at threshold with <= passes', () => {
    const constraints: Constraint[] = [
      { id: 'con1', criterionId: 'c-time', operator: '<=', value: 30 },
    ];
    const result = filterFeasibility(alternatives, constraints, values, criteriaMap);
    expect(result['a1']).toHaveLength(0); // 30 ≤ 30 ✓
  });

  it('multiple constraints: alternative fails if any is violated', () => {
    const constraints: Constraint[] = [
      { id: 'con1', criterionId: 'c-time',  operator: '<=', value: 40 },
      { id: 'con2', criterionId: 'c-price', operator: '<=', value: 120 },
    ];
    const result = filterFeasibility(alternatives, constraints, values, criteriaMap);
    expect(result['a2']).toHaveLength(1); // price 150 > 120
    expect(result['a3']).toHaveLength(1); // time 45 > 40
  });

  it('violation message uses criterion name not ID', () => {
    const constraints: Constraint[] = [
      { id: 'con1', criterionId: 'c-time', operator: '<=', value: 25 },
    ];
    const result = filterFeasibility(alternatives, constraints, values, criteriaMap);
    // a1 (30 min) and a3 (45 min) should be infeasible
    expect(result['a1']).toHaveLength(1);
    expect(result['a1'][0].message).toContain('Delivery Time');
    expect(result['a1'][0].message).not.toContain('c-time');
  });

  it('>= constraint: fails when actual is less', () => {
    const constraints: Constraint[] = [
      { id: 'con1', criterionId: 'c-rating', operator: '>=', value: 4.5 },
    ];
    const result = filterFeasibility(alternatives, constraints, values, criteriaMap);
    expect(result['a1']).toHaveLength(1); // 4.2 < 4.5
    expect(result['a2']).toHaveLength(0); // 4.8 >= 4.5
    expect(result['a3']).toHaveLength(1); // 4.0 < 4.5
  });
});

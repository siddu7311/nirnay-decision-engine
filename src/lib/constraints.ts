// ============================================================
// NIRNAY — Constraint Filtering Module
// ============================================================

import type { Constraint, ConstraintOperator, ConstraintViolation, Alternative } from '../types/decision';

/**
 * Evaluate a single constraint operator.
 */
export function evaluateOperator(
  actual: number,
  operator: ConstraintOperator,
  threshold: number
): boolean {
  switch (operator) {
    case '<':  return actual < threshold;
    case '<=': return actual <= threshold;
    case '=':  return Math.abs(actual - threshold) < 1e-9;
    case '>=': return actual >= threshold;
    case '>':  return actual > threshold;
    default:   return false;
  }
}

/**
 * Format a constraint violation message.
 */
export function formatViolation(
  criterionName: string,
  unit: string,
  actual: number,
  operator: ConstraintOperator,
  threshold: number
): string {
  const unitStr = unit ? ` ${unit}` : '';
  const opLabel: Record<ConstraintOperator, string> = {
    '<':  'less than',
    '<=': 'at most',
    '=':  'equal to',
    '>=': 'at least',
    '>':  'greater than',
  };
  return `${criterionName} is ${actual}${unitStr}, but the constraint requires it to be ${opLabel[operator]} ${threshold}${unitStr}.`;
}

/**
 * Check which alternatives are feasible against all constraints.
 * Returns a violation list per alternative (empty = feasible).
 */
export function filterFeasibility(
  alternatives: Alternative[],
  constraints: Constraint[],
  values: Record<string, Record<string, number>>,
  criteriaMap: Record<string, { name: string; unit: string }>
): Record<string, ConstraintViolation[]> {
  const result: Record<string, ConstraintViolation[]> = {};

  for (const alt of alternatives) {
    const violations: ConstraintViolation[] = [];
    for (const constraint of constraints) {
      const actual = values[alt.id]?.[constraint.criterionId] ?? 0;
      const satisfied = evaluateOperator(actual, constraint.operator, constraint.value);
      if (!satisfied) {
        const crit = criteriaMap[constraint.criterionId];
        violations.push({
          constraint,
          actualValue: actual,
          message: formatViolation(
            crit?.name ?? constraint.criterionId,
            crit?.unit ?? '',
            actual,
            constraint.operator,
            constraint.value
          ),
        });
      }
    }
    result[alt.id] = violations;
  }

  return result;
}

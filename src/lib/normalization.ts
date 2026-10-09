// ============================================================
// NIRNAY — Normalization Module
// ============================================================
// Uses min-max normalization per criterion over feasible alternatives.
// Lower-is-better: (max - value) / (max - min) * 100
// Higher-is-better: (value - min) / (max - min) * 100
// Edge case: if max === min, score = 100 for all (they're equal, no differentiation needed)

import type { Criterion, Direction } from '../types/decision';

export interface NormalizationContext {
  criterionId: string;
  min: number;
  max: number;
  direction: Direction;
}

/**
 * Build normalization contexts from a set of values (only feasible alternatives).
 */
export function buildNormalizationContexts(
  criteria: Criterion[],
  values: Record<string, Record<string, number>>, // alternativeId -> criterionId -> value
  feasibleIds: string[]
): NormalizationContext[] {
  return criteria.map((criterion) => {
    const vals = feasibleIds
      .map((id) => values[id]?.[criterion.id] ?? 0);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    return { criterionId: criterion.id, min, max, direction: criterion.direction };
  });
}

/**
 * Normalize a single value given a context.
 * Returns 0–100.
 */
export function normalizeValue(value: number, ctx: NormalizationContext): number {
  const { min, max, direction } = ctx;
  if (max === min) return 100; // all equal, assign perfect score
  if (direction === 'higher_is_better') {
    return ((value - min) / (max - min)) * 100;
  } else {
    return ((max - value) / (max - min)) * 100;
  }
}

/**
 * Normalize all values for a given set of alternatives.
 * Returns: alternativeId -> criterionId -> normalizedScore (0-100)
 */
export function normalizeAll(
  criteria: Criterion[],
  values: Record<string, Record<string, number>>,
  feasibleIds: string[]
): Record<string, Record<string, number>> {
  const contexts = buildNormalizationContexts(criteria, values, feasibleIds);
  const result: Record<string, Record<string, number>> = {};

  for (const altId of feasibleIds) {
    result[altId] = {};
    for (const ctx of contexts) {
      const raw = values[altId]?.[ctx.criterionId] ?? 0;
      result[altId][ctx.criterionId] = normalizeValue(raw, ctx);
    }
  }

  return result;
}

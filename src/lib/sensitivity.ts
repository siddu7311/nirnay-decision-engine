// ============================================================
// NIRNAY — Sensitivity Analysis
// ============================================================

import type { DecisionInput, SensitivityResult, SensitivityPoint } from '../types/decision';
import { runDecisionEngine } from './decisionEngine';

const WEIGHT_STEPS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];

/**
 * Run sensitivity analysis by varying one criterion's weight
 * and redistributing remaining weights proportionally.
 */
export function runSensitivityAnalysis(
  input: DecisionInput,
  targetCriterionId: string
): SensitivityResult {
  const criterion = input.criteria.find((c) => c.id === targetCriterionId);
  if (!criterion) {
    return { criterionId: targetCriterionId, criterionName: targetCriterionId, points: [], thresholds: [] };
  }

  const otherWeights = input.weights.filter((w) => w.criterionId !== targetCriterionId);
  const totalOtherOriginal = otherWeights.reduce((s, w) => s + w.weight, 0);

  const points: SensitivityPoint[] = [];

  for (const targetWeight of WEIGHT_STEPS) {
    const remaining = 100 - targetWeight;

    // Redistribute remaining weight proportionally among other criteria
    let adjustedWeights = otherWeights.map((w) => ({
      criterionId: w.criterionId,
      weight: totalOtherOriginal > 0
        ? Math.round((w.weight / totalOtherOriginal) * remaining * 10) / 10
        : remaining / otherWeights.length,
    }));

    // Fix floating point drift: ensure total = 100
    const currentTotal = adjustedWeights.reduce((s, w) => s + w.weight, 0) + targetWeight;
    const drift = 100 - currentTotal;
    if (adjustedWeights.length > 0 && Math.abs(drift) > 0.001) {
      adjustedWeights[adjustedWeights.length - 1].weight += drift;
    }

    const newWeights = [
      { criterionId: targetCriterionId, weight: targetWeight },
      ...adjustedWeights,
    ];

    const result = runDecisionEngine({ ...input, weights: newWeights });
    const scores: Record<string, number> = {};
    for (const r of result.rankedResults) {
      if (r.feasible) scores[r.alternative.name] = r.totalScore;
    }

    points.push({
      weight: targetWeight,
      winner: result.recommendation?.alternative.name ?? null,
      scores,
    });
  }

  // Detect thresholds (where recommendation changes)
  const thresholds: { weight: number; from: string; to: string }[] = [];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    if (prev.winner && curr.winner && prev.winner !== curr.winner) {
      thresholds.push({ weight: curr.weight, from: prev.winner, to: curr.winner });
    }
  }

  return {
    criterionId: targetCriterionId,
    criterionName: criterion.name,
    points,
    thresholds,
  };
}

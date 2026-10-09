// ============================================================
// NIRNAY — Decision Engine
// ============================================================
// Pure deterministic function. No randomness. No LLM.
// Given: alternatives, criteria, weights, constraints, values
// Returns: full DecisionResult with scores, ranking, explanation

import type {
  DecisionInput,
  DecisionResult,
  AlternativeResult,
  TradeOff,
  CriterionWeight,
  Constraint,
} from '../types/decision';
import { filterFeasibility } from './constraints';
import { normalizeAll } from './normalization';
import { generateExplanation } from './explanationEngine';

const TIE_TOLERANCE = 0.01; // scores within 0.01 are considered tied

/**
 * Run the full NIRNAY decision engine.
 */
export function runDecisionEngine(input: DecisionInput): DecisionResult {
  const { alternatives, criteria, weights, constraints, values } = input;

  // Build lookup maps
  const criteriaMap = Object.fromEntries(
    criteria.map((c) => [c.id, { name: c.name, unit: c.unit, direction: c.direction }])
  );
  const weightMap: Record<string, number> = Object.fromEntries(
    weights.map((w) => [w.criterionId, w.weight])
  );

  // ---- Step 1: Constraint Filtering ----
  const feasibilityMap = filterFeasibility(alternatives, constraints, values, criteriaMap);
  const feasibleAlts = alternatives.filter((a) => feasibilityMap[a.id].length === 0);
  const infeasibleAlts = alternatives.filter((a) => feasibilityMap[a.id].length > 0);

  // ---- Step 2: Handle no feasible option ----
  if (feasibleAlts.length === 0) {
    const allResults: AlternativeResult[] = alternatives.map((alt) => ({
      alternative: alt,
      feasible: false,
      violations: feasibilityMap[alt.id],
      rawValues: values[alt.id] ?? {},
      normalizedScores: {},
      weightedContributions: {},
      totalScore: 0,
      rank: null,
    }));
    return {
      rankedResults: allResults,
      recommendation: null,
      isTie: false,
      tiedAlternatives: [],
      tradeOffs: [],
      explanation: 'No alternative satisfies all current constraints.',
      criterionExplanations: [],
      noFeasibleOption: true,
    };
  }

  // ---- Step 3: Normalize (only over feasible alternatives) ----
  const feasibleIds = feasibleAlts.map((a) => a.id);
  const normalizedMap = normalizeAll(criteria, values, feasibleIds);

  // ---- Step 4: Weighted scoring ----
  const feasibleResults: AlternativeResult[] = feasibleAlts.map((alt) => {
    const rawValues = values[alt.id] ?? {};
    const normalizedScores = normalizedMap[alt.id] ?? {};
    const weightedContributions: Record<string, number> = {};
    let totalScore = 0;

    for (const criterion of criteria) {
      const normScore = normalizedScores[criterion.id] ?? 0;
      const weight = (weightMap[criterion.id] ?? 0) / 100;
      const contribution = normScore * weight;
      weightedContributions[criterion.id] = contribution;
      totalScore += contribution;
    }

    return {
      alternative: alt,
      feasible: true,
      violations: [],
      rawValues,
      normalizedScores,
      weightedContributions,
      totalScore,
      rank: null, // assigned below
    };
  });

  // ---- Step 5: Rank feasible results ----
  feasibleResults.sort((a, b) => b.totalScore - a.totalScore);
  let rankCounter = 1;
  for (let i = 0; i < feasibleResults.length; i++) {
    if (i > 0 && Math.abs(feasibleResults[i].totalScore - feasibleResults[i - 1].totalScore) < TIE_TOLERANCE) {
      feasibleResults[i].rank = feasibleResults[i - 1].rank; // same rank (tie)
    } else {
      feasibleResults[i].rank = rankCounter;
    }
    rankCounter++;
  }

  // ---- Step 6: Infeasible results ----
  const infeasibleResults: AlternativeResult[] = infeasibleAlts.map((alt) => ({
    alternative: alt,
    feasible: false,
    violations: feasibilityMap[alt.id],
    rawValues: values[alt.id] ?? {},
    normalizedScores: {},
    weightedContributions: {},
    totalScore: 0,
    rank: null,
  }));

  const allResults = [...feasibleResults, ...infeasibleResults];

  // ---- Step 7: Detect tie ----
  const topScore = feasibleResults[0]?.totalScore ?? 0;
  const tied = feasibleResults.filter(
    (r) => Math.abs(r.totalScore - topScore) < TIE_TOLERANCE
  );
  const isTie = tied.length > 1;
  const recommendation = isTie ? null : feasibleResults[0] ?? null;

  // ---- Step 8: Trade-off analysis ----
  const tradeOffs: TradeOff[] = [];
  if (recommendation && feasibleResults.length > 1) {
    for (const other of feasibleResults.slice(1)) {
      const advantages: string[] = [];
      const disadvantages: string[] = [];
      for (const criterion of criteria) {
        const winnerNorm = recommendation.normalizedScores[criterion.id] ?? 0;
        const otherNorm = other.normalizedScores[criterion.id] ?? 0;
        if (winnerNorm > otherNorm + 5) {
          advantages.push(criterion.name);
        } else if (winnerNorm < otherNorm - 5) {
          disadvantages.push(criterion.name);
        }
      }
      if (advantages.length > 0 || disadvantages.length > 0) {
        tradeOffs.push({
          advantageOver: other.alternative.name,
          advantages,
          disadvantages,
        });
      }
    }
  }

  // ---- Step 9: Generate explanation ----
  const { explanation, criterionExplanations } = generateExplanation({
    recommendation,
    isTie,
    tiedAlternatives: tied,
    feasibleResults,
    infeasibleResults,
    criteria,
    weights,
    constraints,
    criteriaMap,
    tradeOffs,
  });

  return {
    rankedResults: allResults,
    recommendation,
    isTie,
    tiedAlternatives: isTie ? tied : [],
    tradeOffs,
    explanation,
    criterionExplanations,
    noFeasibleOption: false,
  };
}

/**
 * Re-run the engine with modified weights and/or constraints (for What-If).
 */
export function runWhatIf(
  input: DecisionInput,
  newWeights: CriterionWeight[],
  newConstraints: Constraint[]
): DecisionResult {
  return runDecisionEngine({
    ...input,
    weights: newWeights,
    constraints: newConstraints,
  });
}

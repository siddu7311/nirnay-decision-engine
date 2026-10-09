// ============================================================
// NIRNAY — Explanation Engine
// ============================================================
// Generates human-readable explanations from actual calculated data.
// No LLM. No hardcoded text. All statements derived from numbers.

import type {
  AlternativeResult,
  Criterion,
  CriterionWeight,
  Constraint,
  TradeOff,
  ConstraintViolation,
} from '../types/decision';

interface ExplanationInput {
  recommendation: AlternativeResult | null;
  isTie: boolean;
  tiedAlternatives: AlternativeResult[];
  feasibleResults: AlternativeResult[];
  infeasibleResults: AlternativeResult[];
  criteria: Criterion[];
  weights: CriterionWeight[];
  constraints: Constraint[];
  criteriaMap: Record<string, { name: string; unit: string; direction: string }>;
  tradeOffs: TradeOff[];
}

interface ExplanationOutput {
  explanation: string;
  criterionExplanations: string[];
}

export function generateExplanation(input: ExplanationInput): ExplanationOutput {
  const {
    recommendation,
    isTie,
    tiedAlternatives,
    infeasibleResults,
    criteria,
    weights,
    tradeOffs,
  } = input;

  const weightMap = Object.fromEntries(weights.map((w) => [w.criterionId, w.weight]));

  // --- Handle tie ---
  if (isTie) {
    const names = tiedAlternatives.map((a) => a.alternative.name).join(' and ');
    const score = tiedAlternatives[0]?.totalScore.toFixed(1);
    return {
      explanation: `A tie was detected between ${names} with equal scores of ${score}/100. NIRNAY cannot distinguish a clear winner. Consider adjusting priorities or adding criteria to break the tie.`,
      criterionExplanations: [],
    };
  }

  // --- No recommendation ---
  if (!recommendation) {
    return {
      explanation: 'No feasible option could be recommended.',
      criterionExplanations: [],
    };
  }

  // --- Find winner's top contributing criterion ---
  const sortedContributions = criteria
    .map((c) => ({
      criterion: c,
      contribution: recommendation.weightedContributions[c.id] ?? 0,
      weight: weightMap[c.id] ?? 0,
      normScore: recommendation.normalizedScores[c.id] ?? 0,
    }))
    .sort((a, b) => b.contribution - a.contribution);

  const topCriterion = sortedContributions[0];
  const winnerName = recommendation.alternative.name;
  const winnerScore = recommendation.totalScore.toFixed(1);

  // --- Build main explanation ---
  let parts: string[] = [];

  parts.push(
    `${winnerName} achieves the highest weighted score of ${winnerScore}/100 among all feasible alternatives.`
  );

  if (topCriterion) {
    parts.push(
      `Its recommendation is primarily driven by strong performance on ${topCriterion.criterion.name} ` +
      `(weight: ${topCriterion.weight}%, normalized score: ${topCriterion.normScore.toFixed(1)}/100).`
    );
  }

  // --- Describe trade-offs against runner-up ---
  const tradeOff = tradeOffs[0];
  if (tradeOff) {
    if (tradeOff.disadvantages.length > 0) {
      parts.push(
        `Although ${winnerName} performs worse on ${tradeOff.disadvantages.join(' and ')} ` +
        `compared to ${tradeOff.advantageOver}, its advantage in ` +
        `${tradeOff.advantages.length > 0 ? tradeOff.advantages.join(' and ') : 'other criteria'} ` +
        `produces the highest overall score.`
      );
    } else if (tradeOff.advantages.length > 0) {
      parts.push(
        `${winnerName} outperforms ${tradeOff.advantageOver} across ${tradeOff.advantages.join(', ')}.`
      );
    }
  }

  // --- Mention excluded alternatives ---
  if (infeasibleResults.length > 0) {
    const excludedNames = infeasibleResults.map((r) => r.alternative.name).join(', ');
    parts.push(
      `${excludedNames} ${infeasibleResults.length === 1 ? 'was' : 'were'} excluded from consideration due to constraint violations.`
    );
  }

  // --- Criterion-level explanations ---
  const criterionExplanations: string[] = sortedContributions.map(({ criterion, contribution, weight, normScore }) => {
    const rawVal = recommendation.rawValues[criterion.id];
    const rawStr = rawVal !== undefined ? ` (raw value: ${rawVal}${criterion.unit ? ' ' + criterion.unit : ''})` : '';
    return `${criterion.name}: normalized score ${normScore.toFixed(1)}/100${rawStr}, weight ${weight}%, contribution ${contribution.toFixed(2)} points.`;
  });

  return {
    explanation: parts.join(' '),
    criterionExplanations,
  };
}

/**
 * Generate a trade-off narrative for a specific winner vs. runner-up.
 */
export function generateTradeOffNarrative(
  winnerResult: AlternativeResult,
  otherResult: AlternativeResult,
  criteria: Criterion[]
): string {
  const advantages: string[] = [];
  const disadvantages: string[] = [];

  for (const criterion of criteria) {
    const winnerNorm = winnerResult.normalizedScores[criterion.id] ?? 0;
    const otherNorm = otherResult.normalizedScores[criterion.id] ?? 0;
    const diff = winnerNorm - otherNorm;
    if (diff > 5) advantages.push(criterion.name);
    else if (diff < -5) disadvantages.push(criterion.name);
  }

  const winnerName = winnerResult.alternative.name;
  const otherName = otherResult.alternative.name;

  if (advantages.length === 0 && disadvantages.length === 0) {
    return `${winnerName} and ${otherName} perform similarly across all criteria.`;
  }

  let narrative = '';
  if (advantages.length > 0) {
    narrative += `${winnerName} is stronger on ${advantages.join(', ')}.`;
  }
  if (disadvantages.length > 0) {
    if (narrative) narrative += ' ';
    narrative += `It falls behind ${otherName} on ${disadvantages.join(', ')}, but this is outweighed by other criteria.`;
  }
  return narrative;
}

/**
 * Generate violation explanation text for a single alternative.
 */
export function formatViolations(violations: ConstraintViolation[]): string {
  if (violations.length === 0) return '';
  if (violations.length === 1) return violations[0].message;
  return violations.map((v, i) => `(${i + 1}) ${v.message}`).join(' ');
}

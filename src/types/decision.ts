// ============================================================
// NIRNAY — Core TypeScript Types
// ============================================================

export type Direction = 'lower_is_better' | 'higher_is_better';

export type ConstraintOperator = '<' | '<=' | '=' | '>=' | '>';

export interface Alternative {
  id: string;
  name: string;
  description: string;
}

export interface Criterion {
  id: string;
  name: string;
  description: string;
  unit: string;
  direction: Direction;
}

export interface CriterionWeight {
  criterionId: string;
  weight: number; // 0–100, must sum to 100
}

export interface Constraint {
  id: string;
  criterionId: string;
  operator: ConstraintOperator;
  value: number;
}

// Raw user-entered values matrix: alternativeId → criterionId → number
export type ValueMatrix = Record<string, Record<string, number>>;

// ============================================================
// Engine inputs / outputs
// ============================================================

export interface DecisionInput {
  alternatives: Alternative[];
  criteria: Criterion[];
  weights: CriterionWeight[];
  constraints: Constraint[];
  values: ValueMatrix;
}

export interface ConstraintViolation {
  constraint: Constraint;
  actualValue: number;
  message: string;
}

export interface AlternativeResult {
  alternative: Alternative;
  feasible: boolean;
  violations: ConstraintViolation[];
  rawValues: Record<string, number>;
  normalizedScores: Record<string, number>;
  weightedContributions: Record<string, number>;
  totalScore: number;
  rank: number | null; // null if infeasible
}

export interface TradeOff {
  advantageOver: string; // alternative name
  advantages: string[];  // criterion names where winner is better
  disadvantages: string[]; // criterion names where winner is worse
}

export interface DecisionResult {
  rankedResults: AlternativeResult[];
  recommendation: AlternativeResult | null;
  isTie: boolean;
  tiedAlternatives: AlternativeResult[];
  tradeOffs: TradeOff[];
  explanation: string;
  criterionExplanations: string[];
  noFeasibleOption: boolean;
}

// ============================================================
// Saved Decision (persisted to LocalStorage)
// ============================================================

export interface SavedDecision {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  input: DecisionInput;
  result: DecisionResult | null;
}

// ============================================================
// What-If Scenario
// ============================================================

export interface WhatIfScenario {
  weights: CriterionWeight[];
  constraints: Constraint[];
}

// ============================================================
// Sensitivity Analysis
// ============================================================

export interface SensitivityPoint {
  weight: number;
  winner: string | null;
  scores: Record<string, number>;
}

export interface SensitivityResult {
  criterionId: string;
  criterionName: string;
  points: SensitivityPoint[];
  thresholds: { weight: number; from: string; to: string }[];
}

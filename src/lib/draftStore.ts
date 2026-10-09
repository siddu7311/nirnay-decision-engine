// ============================================================
// NIRNAY — Decision Draft Store
// Persists in-progress wizard state to sessionStorage so that
// navigating Results → Edit → Results never loses user data.
// ============================================================

import type {
  Alternative,
  Criterion,
  CriterionWeight,
  Constraint,
  ValueMatrix,
} from '../types/decision';

export interface DecisionDraft {
  id: string;
  name: string;
  alternatives: Alternative[];
  criteria: Criterion[];
  weights: CriterionWeight[];
  constraints: Constraint[];
  values: ValueMatrix;
}

const KEY = (id: string) => `nirnay_draft_${id}`;

export function saveDraft(draft: DecisionDraft): void {
  try {
    sessionStorage.setItem(KEY(draft.id), JSON.stringify(draft));
  } catch {
    // storage full — ignore
  }
}

export function loadDraft(id: string): DecisionDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY(id));
    return raw ? (JSON.parse(raw) as DecisionDraft) : null;
  } catch {
    return null;
  }
}

export function clearDraft(id: string): void {
  try {
    sessionStorage.removeItem(KEY(id));
  } catch {
    // ignore
  }
}

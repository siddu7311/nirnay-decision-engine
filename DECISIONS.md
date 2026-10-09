# NIRNAY — Technical Decisions

## 1. Why no backend?

NIRNAY is designed to run entirely in the browser. This keeps it:
- Easy to deploy (static hosting, no server required)
- Privacy-preserving (data never leaves the device)
- Zero-dependency for users (no sign-up, no API keys)

LocalStorage provides sufficient persistence for the use case.

---

## 2. Why no LLM for the recommendation?

The core promise of NIRNAY is **transparency**. If an LLM produced the recommendation, users would have to trust a black box. Instead, every score is derived from a formula the user can verify. The explanation is generated from actual calculated numbers, not AI-generated text.

This also makes NIRNAY **reproducible**: given the same inputs, the engine always produces the same output.

---

## 3. Why min-max normalization?

Min-max is the simplest, most interpretable normalization method:
- A score of 100 means "best in the feasible set"
- A score of 0 means "worst in the feasible set"
- The formula is visible and explainable on the Results page

Alternatives like Z-score normalization or rank-based normalization were considered but rejected because they are harder to explain to non-technical users.

---

## 4. Why normalize only over feasible alternatives?

If infeasible alternatives are included in normalization, the min/max values can shift artificially, distorting the relative scores of feasible alternatives. NIRNAY normalizes only over alternatives that survive constraint filtering.

---

## 5. Why a 6-step wizard instead of a single form?

Breaking the decision into steps reduces cognitive load, allows per-step validation, and makes the process pedagogically clear. Users understand *why* each step exists.

---

## 6. Why Recharts instead of Chart.js or D3?

Recharts is the most idiomatic charting library for React + TypeScript. It has good TypeScript support, is composable, and requires no imperative DOM manipulation. All chart data is derived from the engine output; no calculations are duplicated inside chart components.

---

## 7. Why Tailwind CSS v4?

Tailwind v4 uses a CSS-first configuration approach and integrates natively with Vite via `@tailwindcss/vite`. It removes the need for a `tailwind.config.js` file and simplifies the build pipeline.

---

## 8. Why separate `explanationEngine.ts`?

Separating explanation generation from the scoring logic:
- Makes the engine testable without the explanation layer
- Allows the explanation text to evolve independently
- Makes it clear that explanations are derived, not invented

---

## 9. Tie tolerance of 0.01

Floating-point arithmetic can produce near-equal but non-identical scores. A tolerance of 0.01 points prevents false ties (e.g. 82.4000001 vs 82.4000000) while still catching genuine ties.

---

## 10. Trade-off threshold of 5 normalized points

The original threshold of 1 normalized point was too sensitive — any tiny difference would be reported as an advantage/disadvantage, producing noisy and misleading output. A threshold of 5 points ensures that only meaningful differences are surfaced in the trade-off analysis and criterion comparison.

---

## 11. What-If sandbox model

The WhatIf page operates entirely in memory. The original saved decision is not modified until the user explicitly clicks "Apply Scenario & Save". This prevents accidental data corruption and makes the tool safe to explore without commitment.

---

## 12. Why Vitest instead of Jest?

Vitest is Vite-native, requires zero additional configuration in a Vite project, and shares the same transformation pipeline as the production build. This ensures that the code executed in tests is identical to what runs in production.

---

## 13. Decision title fallback strategy

When saving a decision, the name is resolved in this priority:
1. User-entered decision name (trimmed)
2. Existing saved name (on edit)
3. First alternative's name (if available)
4. Literal string "Decision"

This prevents "Untitled Decision" from appearing when the user has already entered option names.

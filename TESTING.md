# NIRNAY — Testing

## Test Infrastructure

NIRNAY uses **Vitest** as the test runner. Tests live alongside the source files in `src/lib/`.

```bash
npm test          # run all tests once
npm run test:watch  # run in watch mode (re-runs on file change)
```

All test files are pure TypeScript (no React, no DOM). The decision engine is a pure function — same inputs always produce the same output — making it highly testable without mocking.

---

## Test Files

| File | Tests |
|---|---|
| `src/lib/normalization.test.ts` | 16 |
| `src/lib/constraints.test.ts` | 24 |
| `src/lib/decisionEngine.test.ts` | 19 |
| `src/lib/sensitivity.test.ts` | 8 |
| **Total** | **67** |

---

## Unit Test Cases

### Normalization (`lib/normalization.ts`)

| Test | Input | Expected |
|---|---|---|
| Higher is better: min value | value=10, min=10, max=20 | 0 |
| Higher is better: max value | value=20, min=10, max=20 | 100 |
| Higher is better: midpoint | value=50, min=0, max=100 | 50 |
| Lower is better: min value | value=10, min=10, max=20 | 100 |
| Lower is better: max value | value=20, min=10, max=20 | 0 |
| Lower is better: midpoint | value=50, min=0, max=100 | 50 |
| Equal values (max === min) | value=50, min=50, max=50 | 100 |
| Three values, higher is better | [0, 50, 100] | [0, 50, 100] |
| Three values, lower is better | [0, 50, 100] | [100, 50, 0] |
| Ignores infeasible alternative IDs in context | infeasible alt not in feasibleIds | max/min unaffected |
| Missing value defaults to 0 | no entry for criterion | normalized from 0 |

### Constraint Filtering (`lib/constraints.ts`)

| Test | Constraint | Value | Expected |
|---|---|---|---|
| `<` passes | Price < 200 | 150 | Feasible |
| `<` fails at boundary | Price < 200 | 200 | Infeasible |
| `<` fails above | Price < 200 | 250 | Infeasible |
| `<=` passes at boundary | Time ≤ 40 | 40 | Feasible |
| `<=` passes below | Time ≤ 40 | 35 | Feasible |
| `<=` fails above | Time ≤ 40 | 45 | Infeasible, message includes 45 |
| `=` passes exactly | Score = 100 | 100 | Feasible |
| `=` fails | Score = 100 | 99 | Infeasible |
| `=` floating point tolerance | 1.0000000001 = 1 | within 1e-9 | Feasible |
| `>=` passes at boundary | Rating ≥ 4.0 | 4.0 | Feasible |
| `>=` passes above | Rating ≥ 4.0 | 4.2 | Feasible |
| `>=` fails below | Rating ≥ 4.0 | 3.8 | Infeasible |
| `>` passes above | Count > 5 | 6 | Feasible |
| `>` fails at boundary | Count > 5 | 5 | Infeasible |
| Message uses criterion name | violated | message contains "Delivery Time", not "crit-time" |
| Multiple constraints | two violated | both violations recorded |

### Weighted Scoring & Ranking (`lib/decisionEngine.ts`)

| Test | Setup | Expected |
|---|---|---|
| Determinism | same input × 2 | identical output |
| Single criterion 100% weight | winner gets highest raw score | winner score = 100 |
| Zero-weight criterion | weight = 0 | no contribution |
| All equal values, two alts | same value for all | tie detected, recommendation = null |
| Equal weights, single alt | all criteria equal | total score = 100 |
| All infeasible | constraint rejects all | `noFeasibleOption = true`, `recommendation = null` |
| Constraint excludes alt | time > 40 → C excluded | C.feasible = false, C.rank = null |
| 3 distinct scores | distinct values | ranks 1, 2, 3 |
| Scores within 0.01 | engineered tie | `isTie = true`, tied alts share rank 1 |
| Single feasible alt | tight constraint | no tie, that alt is rank 1 |
| Trade-off names | threshold >5 pts | advantages/disadvantages use criterion names not IDs |
| runWhatIf immutability | modify weights | original input.weights unchanged |

### Sensitivity Analysis (`lib/sensitivity.ts`)

| Test | Expected |
|---|---|
| Unknown criterion ID | empty points and thresholds |
| 16 weight steps generated | `points.length === 16` |
| Correct criterion name returned | `criterionName` matches input |
| Each point has weight and scores | weight > 0, scores for feasible alts |
| Scores are non-negative | all `point.scores[name] >= 0` |
| Threshold detection | `threshold.from !== threshold.to` |
| No thresholds when dominant alt | dominant alt wins at every weight step |

---

## Edge Cases Verified

- `max === min` for a criterion → all alternatives score 100 for that criterion (no division by zero)
- All alternatives infeasible → `noFeasibleOption = true`, no score computed
- Tie within 0.01 → `isTie = true`, `recommendation = null`, `tiedAlternatives` populated
- Empty constraints → all alternatives are feasible
- Single feasible alternative → that alternative wins automatically (no tie)
- Zero-weight criterion → `weightedContributions[c.id]` is 0, total unaffected
- Missing value in ValueMatrix → defaults to 0

---

## What Is Not Tested

- **React component rendering** (no React Testing Library; component tests add complexity for marginal benefit at this project scale)
- **LocalStorage persistence** (storage module is thin wrappers; tested manually)
- **Print/export** (browser-dependent; tested manually)

To add component tests in the future:

```bash
npm install -D @testing-library/react @testing-library/user-event jsdom
```

Then add `environment: 'jsdom'` to `vite.config.ts` test section.

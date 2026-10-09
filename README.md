# NIRNAY — The Decision Engine

> **"From choices to confident decisions."**

NIRNAY (निर्णय) means *"Decision"* in Sanskrit and Hindi. It is a transparent, deterministic decision-support system that helps you evaluate multiple alternatives against competing objectives, priorities, and hard constraints.

---

## Problem Statement

Real-world decisions are complex:
- Multiple alternatives exist
- Multiple criteria matter
- Criteria have different units and directions
- Different people assign different priorities
- Some constraints are non-negotiable
- Trade-offs must be understood and communicated

Most tools either oversimplify (gut feel) or hide the logic (black-box AI). **NIRNAY exposes every step of the process.**

---

## Features

| Feature | Description |
|---|---|
| Multi-step Decision Builder | Guided 6-step wizard: Options → Objectives → Priorities → Constraints → Values → Review |
| Hard Constraint Filtering | Automatically excludes infeasible alternatives before scoring |
| Min-Max Normalization | Normalizes all criteria to a common 0–100 scale (only over feasible alternatives) |
| Weighted Scoring | Combines normalized scores using user-defined priorities |
| Transparent Results | Shows raw values, normalized scores, weighted contributions per criterion |
| How Score Was Calculated | Collapsible step-by-step formula breakdown on the Results page |
| Strongest & Weakest Criteria | Highlights best and worst performing criteria for the recommended alternative |
| Trade-off Analysis | Compares winner vs. runner-up on each criterion (threshold: >5 normalized points) |
| Criterion-Level Heatmap | Horizontal bar chart comparing normalized scores across all feasible alternatives |
| Key Strengths & Weaknesses | Summarizes criteria with normalized score ≥70 (strength) or <40 (weakness) |
| Plain-English Explanation | Auto-generated from actual data — not templated or AI-generated |
| What-If Analysis | Sandbox: change weights and constraints, see score differences, apply or discard |
| Sensitivity Analysis | Vary one criterion's weight to find where the recommendation changes |
| Decision History | Save, load, rename, duplicate, delete decisions via LocalStorage |
| Export | JSON (full decision), CSV (scores with raw/normalized/weighted columns), print-ready HTML report |
| Decision Report | Full print report: recommendation, explanation, ranking, score breakdown, methodology |
| Demo Mode | One-click "Food Delivery Decision" demo |
| Tie Handling | Explicit tie detection (tolerance 0.01); working action buttons to resolve ties |
| No Feasible Option | Explicit handling with per-alternative violation explanations |

---

## Technology Stack

- **React 19** + **TypeScript** — UI framework
- **Vite** — Build tool
- **Tailwind CSS v4** — Utility-first styling
- **Recharts** — Charts (stacked bar, horizontal comparison bar, sensitivity line chart)
- **Lucide React** — Icons
- **Vitest** — Unit tests
- **LocalStorage** — Client-side persistence (no backend required)
- **No AI/LLM** — All decisions computed deterministically

---

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Production build
npm run build
```

---

## Project Structure

```
src/
  lib/
    decisionEngine.ts      # Core scoring pipeline (pure function)
    normalization.ts       # Min-max normalization
    constraints.ts         # Hard constraint filtering
    explanationEngine.ts   # Plain-English explanation generation
    sensitivity.ts         # Sensitivity analysis
    export.ts              # JSON, CSV, print report
    storage.ts             # LocalStorage CRUD
    draftStore.ts          # SessionStorage for in-progress wizard state
  pages/
    Results.tsx            # Results page with all charts and explainability
    WhatIf.tsx             # What-If sandbox
    Sensitivity.tsx        # Sensitivity analysis
    NewDecision.tsx        # New decision wizard
    EditDecision.tsx       # Edit existing decision
    Dashboard.tsx          # Decision list
    History.tsx            # Decision history
  types/
    decision.ts            # All TypeScript interfaces
  components/
    ui.tsx                 # Reusable primitives
    Layout.tsx, Sidebar.tsx, StepProgress.tsx
  data/
    demo.ts                # Food Delivery demo scenario
```

---

## Scoring Algorithm (Summary)

1. **Constraint filtering**: Alternatives that violate any hard constraint are marked infeasible and excluded from scoring.
2. **Normalization**: For each criterion, values are normalized to 0–100 using min-max normalization over the feasible set only.
3. **Weighted scoring**: Each normalized score is multiplied by `weight / 100`. Sum of all contributions = total score (0–100).
4. **Ranking**: Sorted by total score descending. Scores within 0.01 of each other are treated as tied.
5. **Output**: Recommendation (or tie/no-feasible-option), explanation, trade-offs, criterion breakdown.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full data flow diagram and [DECISIONS.md](./DECISIONS.md) for design rationale.

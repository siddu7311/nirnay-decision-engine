import React from 'react';
import { Card, CardBody, CardHeader, PageHeader, Badge } from '../components/ui';

const Formula: React.FC<{ label: string; formula: string; description: string }> = ({ label, formula, description }) => (
  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
    <div className="text-xs font-bold text-indigo-700 uppercase mb-1">{label}</div>
    <code className="block text-sm font-mono text-gray-900 bg-white border border-gray-200 rounded px-3 py-2 my-2">{formula}</code>
    <p className="text-xs text-gray-600">{description}</p>
  </div>
);

const Step: React.FC<{ number: number; title: string; children: React.ReactNode }> = ({ number, title, children }) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0 w-8 h-8 bg-indigo-700 text-white rounded-full flex items-center justify-center text-sm font-bold">
      {number}
    </div>
    <div className="flex-1 pb-6 border-l-2 border-gray-100 pl-4 -ml-4 ml-4">
      <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
      {children}
    </div>
  </div>
);

export const HowItWorks: React.FC = () => {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader
        title="How NIRNAY Decides"
        subtitle="A transparent, reproducible decision methodology with no black boxes."
      />

      {/* Core statement */}
      <Card className="mb-6 border-indigo-100 bg-indigo-50">
        <CardBody>
          <p className="text-sm text-indigo-900 leading-relaxed font-medium">
            NIRNAY does not hide the decision process behind an AI model. Every recommendation is
            reproducible from the provided data, priorities, and constraints. Given the same inputs,
            NIRNAY will always produce the same output.
          </p>
        </CardBody>
      </Card>

      {/* Flow */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">The Decision Flow</h2>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-2 items-center text-sm text-gray-600">
            {['Options', 'Objectives', 'Priorities', 'Constraints', 'Evaluation', 'Trade-offs', 'Ranking', 'Recommendation', 'Explanation'].map((s, i, arr) => (
              <React.Fragment key={s}>
                <Badge variant="indigo">{s}</Badge>
                {i < arr.length - 1 && <span className="text-gray-400">→</span>}
              </React.Fragment>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Methodology steps */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Methodology</h2>
        </CardHeader>
        <CardBody className="space-y-0">
          <Step number={1} title="Constraint Filtering">
            <p className="text-sm text-gray-700 mb-3">
              Before scoring, NIRNAY evaluates every alternative against the user's hard constraints.
              Any alternative that violates even one constraint is marked <Badge variant="danger">Infeasible</Badge> and
              excluded from scoring. Infeasible alternatives cannot win.
            </p>
            <p className="text-xs text-gray-500">
              Supported operators: &lt;, ≤, =, ≥, &gt;. Violations show the exact actual value vs. the threshold.
            </p>
          </Step>

          <Step number={2} title="Min-Max Normalization">
            <p className="text-sm text-gray-700 mb-3">
              Because different criteria have different units (₹, minutes, stars), they must be normalized
              to a common 0–100 scale before combining. NIRNAY uses min-max normalization, applied only
              over feasible alternatives.
            </p>
            <div className="space-y-3">
              <Formula
                label="Higher is Better (e.g. Rating)"
                formula="score = (value − min) / (max − min) × 100"
                description="The best (highest) value in the feasible set receives 100. The worst receives 0."
              />
              <Formula
                label="Lower is Better (e.g. Price)"
                formula="score = (max − value) / (max − min) × 100"
                description="The best (lowest) value in the feasible set receives 100. The worst receives 0."
              />
              <Formula
                label="Edge Case: All values equal"
                formula="score = 100 (for all alternatives)"
                description="When max = min, no differentiation is possible. All alternatives receive 100 for that criterion."
              />
            </div>
          </Step>

          <Step number={3} title="Weighted Scoring">
            <p className="text-sm text-gray-700 mb-3">
              Each criterion's normalized score is multiplied by its user-assigned weight (as a fraction of 100),
              and the results are summed to give a total weighted score.
            </p>
            <Formula
              label="Weighted Score"
              formula="score = Σ (normalizedScore_i × weight_i / 100)"
              description="Sum over all criteria. Weights must total 100%. Higher total score = stronger option."
            />
            <p className="text-xs text-gray-500 mt-2">
              The algorithm is deterministic. Given the same inputs, it will always produce the same output.
              No randomness. No LLM.
            </p>
          </Step>

          <Step number={4} title="Ranking">
            <p className="text-sm text-gray-700">
              Feasible alternatives are sorted by descending total weighted score. The highest score wins.
              If two alternatives are within 0.01 points of each other, a tie is declared and no winner is
              selected — the user is asked to refine priorities.
            </p>
          </Step>

          <Step number={5} title="Trade-off Explanation">
            <p className="text-sm text-gray-700">
              NIRNAY compares the winner's normalized scores against each runner-up on every criterion.
              Where the winner scores higher, it lists an advantage. Where it scores lower, it lists a trade-off.
              This explanation is always derived from actual numbers — never invented.
            </p>
          </Step>

          <Step number={6} title="Recommendation">
            <p className="text-sm text-gray-700">
              The feasible alternative with the highest total weighted score is recommended.
              The recommendation includes: raw values, normalized scores per criterion, weighted contributions,
              trade-offs, and a full plain-English explanation.
            </p>
          </Step>
        </CardBody>
      </Card>

      {/* Assumptions */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Documented Assumptions</h2>
        </CardHeader>
        <CardBody>
          <ul className="space-y-2 text-sm text-gray-700">
            {[
              'Criteria are independent enough to be scored and combined separately.',
              'Weights represent user priorities and must sum to exactly 100%.',
              'All criteria are normalized to 0–100 before combining.',
              'Constraints are hard requirements — violations automatically disqualify an option.',
              'Infeasible options cannot win, regardless of their scores.',
              'Higher final weighted score is always preferred.',
              'Equal values on a criterion receive equal normalized scores.',
              'Calculations are deterministic: same inputs always produce same outputs.',
              'Normalization is calculated only over feasible alternatives.',
            ].map((assumption) => (
              <li key={assumption} className="flex gap-2">
                <span className="text-indigo-500 flex-shrink-0 mt-0.5">•</span>
                {assumption}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      {/* Worked example */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Worked Example — Food Delivery</h2>
        </CardHeader>
        <CardBody className="space-y-4 text-sm text-gray-700">
          <p>Three options: A (₹100, 30 min, 4.2★), B (₹150, 20 min, 4.8★), C (₹80, 45 min, 4.0★)</p>
          <p>Weights: Price 50%, Delivery Time 30%, Rating 20%. Constraint: Delivery Time ≤ 40 min.</p>

          <div className="bg-red-50 rounded p-3 border border-red-100 text-xs">
            <strong>Step 1 — Constraint:</strong> C has delivery time 45 min &gt; 40 min → C is infeasible.
          </div>

          <div className="bg-blue-50 rounded p-3 border border-blue-100 text-xs">
            <strong>Step 2 — Normalize</strong> (over A, B only):<br/>
            Price (lower is better): A = (150–100)/(150–100) × 100 = <strong>100</strong>, B = 0<br/>
            Time (lower is better): A = (30–20)/(30–20) × 100 = <strong>100</strong>, B = (30–20)/(30–20) × 100... wait — min=20, max=30: A=(30–30)/(30–20)=0... let's recalculate: A=(30-30)/(30-20)=0, B=(30-20)/(30-20)=<strong>100</strong><br/>
            Rating (higher is better): A = (4.2–4.2)/(4.8–4.2) × 100 = 0, B = <strong>100</strong>
          </div>

          <div className="bg-green-50 rounded p-3 border border-green-100 text-xs">
            <strong>Step 3 — Weighted scores:</strong><br/>
            A: 100×0.5 + 0×0.3 + 0×0.2 = <strong>50.0</strong><br/>
            B: 0×0.5 + 100×0.3 + 100×0.2 = <strong>50.0</strong> — Tie!<br/>
            <em>In practice: try Price 50%, Time 30%, Rating 20% on the actual demo to see the live calculation.</em>
          </div>

          <p className="text-xs text-gray-500">
            Load the demo from the Dashboard to see NIRNAY calculate this interactively. Modify weights to see the recommendation change in real time.
          </p>
        </CardBody>
      </Card>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Award, XCircle, TrendingUp,
  FileJson, FileText, Printer, GitBranch, BarChart2,
  CheckCircle, AlertTriangle, Info, ArrowLeft,
  SlidersHorizontal, Shield, Table2, Pencil, HelpCircle,
  ThumbsUp, ThumbsDown,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from 'recharts';
import { getDecision } from '../lib/storage';
import { exportJSON, exportCSV, printReport } from '../lib/export';
import { formatViolations } from '../lib/explanationEngine';
import { Card, CardBody, CardHeader, Badge, Button, Alert, PageHeader } from '../components/ui';
import type { SavedDecision, AlternativeResult } from '../types/decision';

export const Results: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [decision, setDecision] = useState<SavedDecision | null>(null);

  useEffect(() => {
    if (id) {
      const d = getDecision(id);
      setDecision(d);
    }
  }, [id]);

  if (!decision) {
    return (
      <div className="p-6">
        <Alert variant="danger">Decision not found.</Alert>
        <Button variant="secondary" onClick={() => navigate('/')} className="mt-4">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  const { result, input } = decision;

  if (!result) {
    return (
      <div className="p-6">
        <Alert variant="warning">This decision has no results yet.</Alert>
        <Button variant="secondary" onClick={() => navigate('/')} className="mt-4">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title={decision.name}
        subtitle={`Evaluated on ${new Date(decision.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`}
        action={
          <div className="flex gap-2 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/decision/${id}/whatif`)}>
              <GitBranch className="w-3 h-3" /> What-If
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/decision/${id}/sensitivity`)}>
              <BarChart2 className="w-3 h-3" /> Sensitivity
            </Button>
            <Button variant="secondary" size="sm" onClick={() => exportJSON(decision)}>
              <FileJson className="w-3 h-3" /> JSON
            </Button>
            <Button variant="secondary" size="sm" onClick={() => exportCSV(decision)}>
              <FileText className="w-3 h-3" /> CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={() => printReport(decision)}>
              <Printer className="w-3 h-3" /> Print
            </Button>
          </div>
        }
      />

      {/* Recommendation Card */}
      {result.noFeasibleOption ? (
        <NoFeasibleCard result={result} decisionId={id!} navigate={navigate} />
      ) : result.isTie ? (
        <TieCard result={result} decisionId={id!} navigate={navigate} />
      ) : result.recommendation ? (
        <RecommendationCard recommendation={result.recommendation} input={input} />
      ) : null}

      {/* Edit actions strip — shown on every result state */}
      <EditActionsStrip decisionId={id!} navigate={navigate} />

      {/* Explanation */}
      <Card className="mt-5">
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-600" /> Why NIRNAY recommends this
          </h2>
        </CardHeader>
        <CardBody className="space-y-3">
          <p className="text-sm text-gray-700 leading-relaxed">{result.explanation}</p>
          {result.criterionExplanations.length > 0 && (
            <div className="space-y-1.5 mt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Criterion Contributions</p>
              {result.criterionExplanations.map((exp, i) => (
                <div key={i} className="text-xs text-gray-600 bg-gray-50 rounded px-3 py-2 border border-gray-100">
                  {exp}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* How score was calculated */}
      {result.recommendation && (
        <HowScoreCalculated recommendation={result.recommendation} input={input} />
      )}

      {/* Ranking Table */}
      <RankingTable result={result} criteria={input.criteria} />

      {/* Score Chart */}
      {!result.noFeasibleOption && result.rankedResults.some((r) => r.feasible) && (
        <ScoreChart result={result} criteria={input.criteria} />
      )}

      {/* Criterion Heatmap — only when 2+ feasible alternatives */}
      {!result.noFeasibleOption && result.rankedResults.filter((r) => r.feasible).length >= 2 && (
        <CriterionHeatmap result={result} input={input} />
      )}

      {/* Criterion Breakdown for winner */}
      {result.recommendation && (
        <CriterionBreakdown recommendation={result.recommendation} input={input} />
      )}

      {/* Trade-off section */}
      {result.tradeOffs.length > 0 && (
        <TradeOffSection tradeOffs={result.tradeOffs} winnerName={result.recommendation?.alternative.name ?? ''} />
      )}

      {/* Strengths and weaknesses */}
      {result.recommendation && !result.isTie && (
        <StrengthsWeaknesses recommendation={result.recommendation} input={input} />
      )}

      {/* Bottom nav */}
      <div className="flex gap-3 mt-6 flex-wrap">
        <Button variant="secondary" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Button>
        <Button variant="ghost" onClick={() => navigate(`/decision/${id}/whatif`)}>
          <GitBranch className="w-4 h-4" /> Explore What-If
        </Button>
      </div>
    </div>
  );
};

// ---- Edit Actions Strip ----
const EditActionsStrip: React.FC<{
  decisionId: string;
  navigate: ReturnType<typeof useNavigate>;
}> = ({ decisionId, navigate }) => (
  <div className="mt-4 flex flex-wrap gap-2">
    <Button
      variant="secondary"
      size="sm"
      onClick={() => navigate(`/decision/${decisionId}/edit?step=2`)}
    >
      <SlidersHorizontal className="w-3 h-3" /> Change Priorities
    </Button>
    <Button
      variant="secondary"
      size="sm"
      onClick={() => navigate(`/decision/${decisionId}/edit?step=3`)}
    >
      <Shield className="w-3 h-3" /> Change Constraints
    </Button>
    <Button
      variant="secondary"
      size="sm"
      onClick={() => navigate(`/decision/${decisionId}/edit?step=4`)}
    >
      <Table2 className="w-3 h-3" /> Review Evaluation
    </Button>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate(`/decision/${decisionId}/edit?step=0`)}
    >
      <Pencil className="w-3 h-3" /> Edit Decision
    </Button>
  </div>
);

// ---- Recommendation Card ----
const RecommendationCard: React.FC<{
  recommendation: AlternativeResult;
  input: SavedDecision['input'];
}> = ({ recommendation, input }) => {
  const score = recommendation.totalScore;
  const alt = recommendation.alternative;
  const pct = Math.min(score, 100);

  // Find strongest and weakest criteria
  const weightMap = Object.fromEntries(input.weights.map((w) => [w.criterionId, w.weight]));
  const sortedContribs = input.criteria
    .map((c) => ({
      name: c.name,
      normScore: recommendation.normalizedScores[c.id] ?? 0,
      weight: weightMap[c.id] ?? 0,
    }))
    .sort((a, b) => b.normScore - a.normScore);

  const strongest = sortedContribs[0];
  const weakest = sortedContribs[sortedContribs.length - 1];

  return (
    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
      <CardBody className="py-6">
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-5 h-5 text-green-600" />
          <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Recommended Option</span>
        </div>
        <div className="flex items-end gap-6 flex-wrap">
          <div>
            <div className="text-3xl font-extrabold text-gray-900">{alt.name}</div>
            {alt.description && <div className="text-sm text-gray-500 mt-1">{alt.description}</div>}
          </div>
          <div className="text-right ml-auto">
            <div className="text-3xl font-extrabold text-green-700">{score.toFixed(1)}<span className="text-lg font-normal text-gray-400">/100</span></div>
            <div className="text-xs text-gray-500">Weighted Score</div>
          </div>
        </div>
        <div className="mt-4 w-full h-2.5 bg-green-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        {/* Raw values summary */}
        <div className="mt-4 flex gap-4 flex-wrap">
          {input.criteria.map((c) => {
            const val = recommendation.rawValues[c.id];
            if (val === undefined) return null;
            return (
              <div key={c.id} className="text-sm">
                <span className="text-gray-500">{c.name}: </span>
                <span className="font-semibold text-gray-900">{val}{c.unit && <span className="text-gray-400 text-xs ml-0.5">{c.unit}</span>}</span>
              </div>
            );
          })}
        </div>
        {/* Strongest / weakest criteria */}
        {sortedContribs.length >= 2 && (
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            {strongest && (
              <span className="flex items-center gap-1 bg-green-100 text-green-800 rounded px-2 py-1">
                <ThumbsUp className="w-3 h-3" /> Strongest: {strongest.name} ({strongest.normScore.toFixed(0)}/100)
              </span>
            )}
            {weakest && weakest.name !== strongest?.name && (
              <span className="flex items-center gap-1 bg-red-50 text-red-700 rounded px-2 py-1">
                <ThumbsDown className="w-3 h-3" /> Weakest: {weakest.name} ({weakest.normScore.toFixed(0)}/100)
              </span>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

// ---- No Feasible Option ----
const NoFeasibleCard: React.FC<{
  result: NonNullable<SavedDecision['result']>;
  decisionId: string;
  navigate: ReturnType<typeof useNavigate>;
}> = ({ result, decisionId, navigate }) => (
  <Card className="border-red-200 bg-red-50">
    <CardBody className="py-6">
      <div className="flex flex-col items-center text-center mb-4">
        <XCircle className="w-12 h-12 text-red-400 mb-3" />
        <div className="text-xl font-bold text-red-800">No Feasible Option</div>
        <p className="text-sm text-red-700 mt-2 max-w-md">
          No alternative satisfies all current constraints. Every option violates at least one hard requirement.
        </p>
      </div>
      <div className="space-y-2 max-w-lg mx-auto mb-5">
        {result.rankedResults.map((r) =>
          r.violations.length > 0 ? (
            <div key={r.alternative.id} className="bg-white rounded-lg p-3 border border-red-200 text-sm">
              <span className="font-semibold text-red-800">{r.alternative.name}:</span>{' '}
              <span className="text-red-700">{formatViolations(r.violations)}</span>
            </div>
          ) : null
        )}
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        <Button variant="danger" size="sm" onClick={() => navigate(`/decision/${decisionId}/edit?step=3`)}>
          <Shield className="w-3 h-3" /> Change Constraints
        </Button>
        <Button variant="secondary" size="sm" onClick={() => navigate(`/decision/${decisionId}/edit?step=0`)}>
          <Pencil className="w-3 h-3" /> Review Decision
        </Button>
      </div>
    </CardBody>
  </Card>
);

// ---- Tie Card ----
const TieCard: React.FC<{
  result: NonNullable<SavedDecision['result']>;
  decisionId: string;
  navigate: ReturnType<typeof useNavigate>;
}> = ({ result, decisionId, navigate }) => (
  <Card className="border-amber-200 bg-amber-50">
    <CardBody className="py-6">
      <div className="flex flex-col items-center text-center mb-4">
        <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
        <div className="text-xl font-bold text-amber-800">Tie Detected</div>
        <p className="text-sm text-amber-700 mt-2 max-w-md">
          Multiple alternatives have equal scores. NIRNAY cannot determine a unique recommendation
          with the current priorities.
        </p>
      </div>
      <div className="flex gap-3 justify-center flex-wrap mb-5">
        {result.tiedAlternatives.map((r) => (
          <div key={r.alternative.id} className="bg-white rounded-lg px-4 py-2 border border-amber-200 text-sm font-semibold text-amber-900">
            {r.alternative.name} — {r.totalScore.toFixed(1)}/100
          </div>
        ))}
      </div>
      <p className="text-xs text-amber-700 text-center mb-4">
        Adjust priorities, constraints, or evaluation values to break the tie.
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        <Button variant="primary" size="sm" onClick={() => navigate(`/decision/${decisionId}/edit?step=2`)}>
          <SlidersHorizontal className="w-3 h-3" /> Change Priorities
        </Button>
        <Button variant="secondary" size="sm" onClick={() => navigate(`/decision/${decisionId}/edit?step=3`)}>
          <Shield className="w-3 h-3" /> Change Constraints
        </Button>
        <Button variant="secondary" size="sm" onClick={() => navigate(`/decision/${decisionId}/edit?step=4`)}>
          <Table2 className="w-3 h-3" /> Review Evaluation
        </Button>
        <Button variant="ghost" size="sm" onClick={() => navigate(`/decision/${decisionId}/edit?step=0`)}>
          <Pencil className="w-3 h-3" /> Edit Decision
        </Button>
      </div>
    </CardBody>
  </Card>
);

// ---- How Score Was Calculated ----
const HowScoreCalculated: React.FC<{
  recommendation: AlternativeResult;
  input: SavedDecision['input'];
}> = ({ recommendation, input }) => {
  const [open, setOpen] = useState(false);
  const weightMap = Object.fromEntries(input.weights.map((w) => [w.criterionId, w.weight]));
  const total = recommendation.totalScore;

  return (
    <Card className="mt-5">
      <CardHeader>
        <button
          className="w-full flex items-center justify-between text-left focus-visible:outline-none"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-500" /> How this score was calculated
          </h2>
          <span className="text-xs text-indigo-600">{open ? 'Hide ▲' : 'Show ▼'}</span>
        </button>
      </CardHeader>
      {open && (
        <CardBody className="space-y-4">
          <p className="text-sm text-gray-600">
            NIRNAY uses <strong>weighted min-max normalization</strong>. Each criterion value is
            normalized to a 0–100 scale relative to the best and worst values among all feasible
            alternatives. The normalized score is then multiplied by the criterion weight (as a
            fraction of 100). The sum of all weighted contributions is the final score.
          </p>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Formula per criterion:</p>
            <div className="bg-gray-50 border border-gray-200 rounded px-4 py-3 font-mono text-xs text-gray-700">
              <div>{'Higher is better: normalized = (value − min) / (max − min) × 100'}</div>
              <div>{'Lower  is better: normalized = (max − value) / (max − min) × 100'}</div>
              <div className="mt-2">{'contribution = normalized × (weight / 100)'}</div>
              <div>{'total score = Σ contribution  [all criteria]'}</div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-gray-200 rounded">
              <thead className="bg-gray-50">
                <tr>
                  {['Criterion', 'Direction', 'Raw Value', 'Normalized (/100)', 'Weight', 'Contribution'].map((h) => (
                    <th key={h} className="text-left px-3 py-2 font-semibold text-gray-600 border-b border-gray-200">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {input.criteria.map((c) => {
                  const raw = recommendation.rawValues[c.id] ?? 0;
                  const norm = recommendation.normalizedScores[c.id] ?? 0;
                  const w = weightMap[c.id] ?? 0;
                  const contrib = recommendation.weightedContributions[c.id] ?? 0;
                  return (
                    <tr key={c.id} className="border-b border-gray-100">
                      <td className="px-3 py-2 font-medium text-gray-800">
                        {c.name}{c.unit && <span className="text-gray-400 ml-1">({c.unit})</span>}
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        {c.direction === 'lower_is_better' ? '↓ lower = better' : '↑ higher = better'}
                      </td>
                      <td className="px-3 py-2 text-gray-700">{raw}</td>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-indigo-700">{norm.toFixed(1)}</span>
                        <span className="text-gray-400 ml-1">/ 100</span>
                      </td>
                      <td className="px-3 py-2 text-gray-700">{w}%</td>
                      <td className="px-3 py-2 font-bold text-green-700">{contrib.toFixed(3)}</td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-50 font-bold">
                  <td className="px-3 py-2 text-gray-700" colSpan={5}>Total Weighted Score</td>
                  <td className="px-3 py-2 text-green-700 text-sm">{total.toFixed(1)} / 100</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 italic">
            Note: Normalization is computed only over feasible alternatives. All scores are relative to the current feasible set.
          </p>
        </CardBody>
      )}
    </Card>
  );
};

// ---- Ranking Table ----
const RankingTable: React.FC<{
  result: NonNullable<SavedDecision['result']>;
  criteria: SavedDecision['input']['criteria'];
}> = ({ result, criteria }) => {
  const feasible = result.rankedResults.filter((r) => r.feasible).sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
  const infeasible = result.rankedResults.filter((r) => !r.feasible);

  const criteriaById = Object.fromEntries(criteria.map((c) => [c.id, c]));

  const getStrength = (r: AlternativeResult): string => {
    if (!r.feasible) return '—';
    const entries = Object.entries(r.normalizedScores).sort((a, b) => b[1] - a[1]);
    const [topId, topScore] = entries[0] ?? [];
    if (!topId) return '—';
    const name = criteriaById[topId]?.name ?? topId;
    return `${name} — ${topScore.toFixed(0)}/100`;
  };

  return (
    <Card className="mt-5">
      <CardHeader>
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" /> Ranking
        </h2>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Option</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Key Strength</th>
            </tr>
          </thead>
          <tbody>
            {feasible.map((r) => (
              <tr key={r.alternative.id} className={`border-b border-gray-50 ${r === result.recommendation ? 'bg-green-50' : ''}`}>
                <td className="px-5 py-3 font-bold text-gray-700">
                  {r === result.recommendation ? (
                    <span className="flex items-center gap-1 text-green-700"><Award className="w-4 h-4" /> 1</span>
                  ) : r.rank}
                </td>
                <td className="px-5 py-3 font-semibold text-gray-900">{r.alternative.name}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-700">{r.totalScore.toFixed(1)}</span>
                    <span className="text-gray-400 text-xs">/100</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <Badge variant="success">
                    <CheckCircle className="w-3 h-3 mr-1" /> Feasible
                  </Badge>
                </td>
                <td className="px-5 py-3 text-gray-500 text-xs hidden md:table-cell">{getStrength(r)}</td>
              </tr>
            ))}
            {infeasible.map((r) => (
              <tr key={r.alternative.id} className="border-b border-gray-50 bg-red-50">
                <td className="px-5 py-3 text-gray-400">—</td>
                <td className="px-5 py-3 font-semibold text-gray-700">{r.alternative.name}</td>
                <td className="px-5 py-3 text-gray-400">—</td>
                <td className="px-5 py-3">
                  <Badge variant="danger">
                    <XCircle className="w-3 h-3 mr-1" /> Infeasible
                  </Badge>
                </td>
                <td className="px-5 py-3 text-xs text-red-600 hidden md:table-cell max-w-xs truncate">
                  {formatViolations(r.violations)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

// ---- Score Bar Chart (stacked weighted contributions) ----
const ScoreChart: React.FC<{
  result: NonNullable<SavedDecision['result']>;
  criteria: SavedDecision['input']['criteria'];
}> = ({ result, criteria }) => {
  const feasible = result.rankedResults.filter((r) => r.feasible);
  const chartData = feasible.map((r) => {
    const row: Record<string, string | number> = { name: r.alternative.name };
    for (const c of criteria) {
      row[c.name] = parseFloat((r.weightedContributions[c.id] ?? 0).toFixed(2));
    }
    return row;
  });

  const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

  return (
    <Card className="mt-5">
      <CardHeader>
        <h2 className="text-base font-semibold text-gray-900">Weighted Score Ranking</h2>
        <p className="text-xs text-gray-500">Stacked weighted contributions per alternative (sums to total score)</p>
      </CardHeader>
      <CardBody>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} label={{ value: 'Score (0–100)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#6b7280' }} />
            <Tooltip
              formatter={(v, name) => [typeof v === 'number' ? `${v.toFixed(2)} pts` : v, String(name ?? '')]}
              labelFormatter={(label) => `Option: ${label}`}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {criteria.map((c, i) => (
              <Bar key={c.id} dataKey={c.name} stackId="a" fill={COLORS[i % COLORS.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
};

// ---- Criterion-Level Heatmap ----
// Shows normalized scores (0–100) for every alternative × criterion combination.
const HEATMAP_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const CriterionHeatmap: React.FC<{
  result: NonNullable<SavedDecision['result']>;
  input: SavedDecision['input'];
}> = ({ result, input }) => {
  const feasible = result.rankedResults.filter((r) => r.feasible).sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));

  // Build chart data: one row per criterion, one bar per alternative
  const chartData = input.criteria.map((c) => {
    const row: Record<string, string | number> = { criterion: c.name };
    for (const r of feasible) {
      row[r.alternative.name] = parseFloat((r.normalizedScores[c.id] ?? 0).toFixed(1));
    }
    return row;
  });

  return (
    <Card className="mt-5">
      <CardHeader>
        <h2 className="text-base font-semibold text-gray-900">Criterion-Level Comparison</h2>
        <p className="text-xs text-gray-500">
          Normalized score (0–100) per criterion for each feasible alternative. Higher is always better on this scale.
        </p>
      </CardHeader>
      <CardBody>
        <ResponsiveContainer width="100%" height={Math.max(220, input.criteria.length * 56)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${v}`}
              label={{ value: 'Normalized Score (0–100)', position: 'insideBottom', offset: -4, fontSize: 11, fill: '#6b7280' }}
            />
            <YAxis type="category" dataKey="criterion" tick={{ fontSize: 12 }} width={110} />
            <Tooltip
              formatter={(v, name) => [typeof v === 'number' ? `${v.toFixed(1)}/100` : v, String(name ?? '')]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {feasible.map((r, i) => (
              <Bar key={r.alternative.id} dataKey={r.alternative.name} fill={HEATMAP_COLORS[i % HEATMAP_COLORS.length]}>
                {chartData.map((_entry, j) => (
                  <Cell
                    key={j}
                    fill={HEATMAP_COLORS[i % HEATMAP_COLORS.length]}
                    fillOpacity={0.75 + 0.25 * ((chartData[j][r.alternative.name] as number ?? 0) / 100)}
                  />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
};

// ---- Criterion Breakdown for winner ----
const CriterionBreakdown: React.FC<{
  recommendation: AlternativeResult;
  input: SavedDecision['input'];
}> = ({ recommendation, input }) => {
  const weightMap = Object.fromEntries(input.weights.map((w) => [w.criterionId, w.weight]));

  const rows = input.criteria.map((c) => ({
    id: c.id,
    name: c.name,
    unit: c.unit,
    direction: c.direction,
    rawValue: recommendation.rawValues[c.id] ?? 0,
    normScore: recommendation.normalizedScores[c.id] ?? 0,
    weight: weightMap[c.id] ?? 0,
    contribution: recommendation.weightedContributions[c.id] ?? 0,
  })).sort((a, b) => b.contribution - a.contribution);

  return (
    <Card className="mt-5">
      <CardHeader>
        <h2 className="text-base font-semibold text-gray-900">
          Criterion Breakdown — {recommendation.alternative.name}
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">Sorted by contribution (highest first)</p>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Criterion', 'Raw Value', 'Normalized', 'Weight', 'Contribution'].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">
                  {row.name}
                  {row.unit && <span className="text-gray-400 ml-1 text-xs">({row.unit})</span>}
                  <div className="text-[10px] text-gray-400">{row.direction === 'lower_is_better' ? '↓ lower = better' : '↑ higher = better'}</div>
                </td>
                <td className="px-5 py-3 text-gray-700">{row.rawValue}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${row.normScore}%` }} />
                    </div>
                    <span className="text-indigo-700 font-medium">{row.normScore.toFixed(1)}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-gray-700">{row.weight}%</td>
                <td className="px-5 py-3 font-bold text-green-700">{row.contribution.toFixed(2)}</td>
              </tr>
            ))}
            <tr className="bg-gray-50 border-t border-gray-200">
              <td className="px-5 py-3 font-bold text-gray-700" colSpan={4}>Total Weighted Score</td>
              <td className="px-5 py-3 font-extrabold text-green-700 text-base">{recommendation.totalScore.toFixed(1)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
};

// ---- Trade-off Section ----
const TradeOffSection: React.FC<{
  tradeOffs: NonNullable<SavedDecision['result']>['tradeOffs'];
  winnerName: string;
}> = ({ tradeOffs, winnerName }) => (
  <Card className="mt-5">
    <CardHeader>
      <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-amber-600" /> Trade-off Analysis
      </h2>
      <p className="text-xs text-gray-500 mt-0.5">
        Criteria where the recommendation outperforms or underperforms each runner-up (difference &gt; 5 normalized points)
      </p>
    </CardHeader>
    <CardBody className="space-y-4">
      {tradeOffs.map((t) => (
        <div key={t.advantageOver} className="border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            {winnerName} vs. {t.advantageOver}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {t.advantages.length > 0 && (
              <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                <p className="text-xs font-bold text-green-700 uppercase mb-2">Advantages</p>
                {t.advantages.map((adv) => (
                  <div key={adv} className="flex items-center gap-2 text-sm text-green-800">
                    <CheckCircle className="w-3.5 h-3.5" /> {adv}
                  </div>
                ))}
              </div>
            )}
            {t.disadvantages.length > 0 && (
              <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                <p className="text-xs font-bold text-red-700 uppercase mb-2">Trade-offs</p>
                {t.disadvantages.map((dis) => (
                  <div key={dis} className="flex items-center gap-2 text-sm text-red-800">
                    <XCircle className="w-3.5 h-3.5" /> {dis}
                  </div>
                ))}
              </div>
            )}
            {t.advantages.length === 0 && t.disadvantages.length === 0 && (
              <p className="text-xs text-gray-500 col-span-2">No criterion differs by more than 5 normalized points.</p>
            )}
          </div>
        </div>
      ))}
    </CardBody>
  </Card>
);

// ---- Strengths and Weaknesses ----
const StrengthsWeaknesses: React.FC<{
  recommendation: AlternativeResult;
  input: SavedDecision['input'];
}> = ({ recommendation, input }) => {
  const weightMap = Object.fromEntries(input.weights.map((w) => [w.criterionId, w.weight]));

  const scored = input.criteria.map((c) => ({
    name: c.name,
    normScore: recommendation.normalizedScores[c.id] ?? 0,
    weight: weightMap[c.id] ?? 0,
  }));

  const strengths = scored.filter((s) => s.normScore >= 70).sort((a, b) => b.normScore - a.normScore);
  const weaknesses = scored.filter((s) => s.normScore < 40).sort((a, b) => a.normScore - b.normScore);

  if (strengths.length === 0 && weaknesses.length === 0) return null;

  return (
    <Card className="mt-5">
      <CardHeader>
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" /> Key Strengths &amp; Weaknesses
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">Based on normalized scores: ≥70 = strength, &lt;40 = weakness</p>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {strengths.length > 0 && (
            <div>
              <p className="text-xs font-bold text-green-700 uppercase mb-2 flex items-center gap-1">
                <ThumbsUp className="w-3.5 h-3.5" /> Strengths
              </p>
              <div className="space-y-2">
                {strengths.map((s) => (
                  <div key={s.name} className="flex items-center justify-between bg-green-50 rounded px-3 py-2 border border-green-100">
                    <span className="text-sm text-green-900 font-medium">{s.name}</span>
                    <span className="text-xs font-bold text-green-700">{s.normScore.toFixed(0)}/100</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {weaknesses.length > 0 && (
            <div>
              <p className="text-xs font-bold text-red-700 uppercase mb-2 flex items-center gap-1">
                <ThumbsDown className="w-3.5 h-3.5" /> Weaknesses
              </p>
              <div className="space-y-2">
                {weaknesses.map((w) => (
                  <div key={w.name} className="flex items-center justify-between bg-red-50 rounded px-3 py-2 border border-red-100">
                    <span className="text-sm text-red-900 font-medium">{w.name}</span>
                    <span className="text-xs font-bold text-red-700">{w.normScore.toFixed(0)}/100</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

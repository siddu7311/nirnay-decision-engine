import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCw, ArrowLeft, GitBranch, Check, Save } from 'lucide-react';
import { getDecision, saveDecision } from '../lib/storage';
import { runWhatIf } from '../lib/decisionEngine';
import { Card, CardBody, CardHeader, Button, Alert, Badge, PageHeader } from '../components/ui';
import type { SavedDecision, CriterionWeight, Constraint, DecisionResult } from '../types/decision';

export const WhatIf: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [decision, setDecision] = useState<SavedDecision | null>(null);

  // Scenario state (modified copies — original is never mutated)
  const [scenarioWeights, setScenarioWeights] = useState<CriterionWeight[]>([]);
  const [scenarioConstraints, setScenarioConstraints] = useState<Constraint[]>([]);
  const [scenarioResult, setScenarioResult] = useState<DecisionResult | null>(null);
  const [calculated, setCalculated] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (id) {
      const d = getDecision(id);
      if (d) {
        setDecision(d);
        setScenarioWeights([...d.input.weights]);
        setScenarioConstraints([...d.input.constraints]);
      }
    }
  }, [id]);

  if (!decision) {
    return (
      <div className="p-6">
        <Alert variant="danger">Decision not found.</Alert>
        <Button variant="secondary" onClick={() => navigate('/')} className="mt-4">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Button>
      </div>
    );
  }

  const { input, result: baseResult } = decision;

  const handleCalculate = () => {
    const newResult = runWhatIf(input, scenarioWeights, scenarioConstraints);
    setScenarioResult(newResult);
    setCalculated(true);
    setSaved(false);
  };

  const handleReset = () => {
    setScenarioWeights([...input.weights]);
    setScenarioConstraints([...input.constraints]);
    setScenarioResult(null);
    setCalculated(false);
    setSaved(false);
  };

  // Apply scenario weights/constraints to the saved decision and navigate to results
  const handleApplyScenario = () => {
    if (!scenarioResult) return;
    const updated: SavedDecision = {
      ...decision,
      input: { ...input, weights: scenarioWeights, constraints: scenarioConstraints },
      result: scenarioResult,
      updatedAt: new Date().toISOString(),
    };
    saveDecision(updated);
    setSaved(true);
    navigate(`/decision/${id}/results`);
  };

  const weightTotal = scenarioWeights.reduce((s, w) => s + w.weight, 0);
  const weightValid = Math.abs(weightTotal - 100) < 0.01;

  const updateWeight = (criterionId: string, val: number) => {
    setScenarioWeights((prev) =>
      prev.map((w) => w.criterionId === criterionId ? { ...w, weight: val } : w)
    );
    setCalculated(false);
    setSaved(false);
  };

  const updateConstraint = (cid: string, field: string, val: string | number) => {
    setScenarioConstraints((prev) =>
      prev.map((c) => c.id === cid ? { ...c, [field]: val } : c)
    );
    setCalculated(false);
    setSaved(false);
  };

  const baseWinner = baseResult?.recommendation?.alternative.name;
  const scenarioWinner = scenarioResult?.recommendation?.alternative.name;
  const recommendationChanged = calculated && baseWinner !== scenarioWinner;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="What-If Analysis"
        subtitle={`Exploring scenarios for: ${decision.name}`}
        action={
          <Button variant="secondary" size="sm" onClick={() => navigate(`/decision/${id}/results`)}>
            <ArrowLeft className="w-3 h-3" /> Back to Results
          </Button>
        }
      />

      <Alert variant="warning" className="mb-5">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <strong>Sandbox mode.</strong> Changes here are <em>not</em> saved to your decision unless you click{' '}
          <strong>Apply Scenario</strong>. The original decision is preserved until you choose to apply.
        </div>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Baseline */}
        <Card className="border-indigo-100">
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-700">Original (Baseline)</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {input.weights.map((w) => {
                const crit = input.criteria.find((c) => c.id === w.criterionId);
                return (
                  <div key={w.criterionId} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{crit?.name}</span>
                    <span className="font-semibold text-gray-900">{w.weight}%</span>
                  </div>
                );
              })}
            </div>
            {input.constraints.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase">Constraints</p>
                {input.constraints.map((con) => {
                  const crit = input.criteria.find((c) => c.id === con.criterionId);
                  return (
                    <div key={con.id} className="text-xs text-gray-600">
                      {crit?.name} {con.operator} {con.value}{crit?.unit ? ` ${crit.unit}` : ''}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">Winner: </span>
              {baseWinner ? (
                <Badge variant="indigo">{baseWinner}</Badge>
              ) : (
                <Badge variant="gray">None / Tie</Badge>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Scenario editor */}
        <Card className="border-amber-100">
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-amber-600" /> Scenario (modify me)
            </h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {/* Weights */}
            <p className="text-xs font-semibold text-gray-500 uppercase">Criterion Weights</p>
            {!weightValid && (
              <Alert variant="warning">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Total: {weightTotal.toFixed(1)}% — must equal 100%.
              </Alert>
            )}
            {weightValid && (
              <p className="text-xs text-gray-400">Total: {weightTotal.toFixed(1)}% ✓</p>
            )}
            {scenarioWeights.map((w) => {
              const crit = input.criteria.find((c) => c.id === w.criterionId);
              const orig = input.weights.find((ow) => ow.criterionId === w.criterionId);
              const changed = orig && orig.weight !== w.weight;
              return (
                <div key={w.criterionId} className="flex items-center gap-2">
                  <label className={`text-sm flex-1 ${changed ? 'font-semibold text-amber-700' : 'text-gray-700'}`}>
                    {crit?.name}
                    {changed && <span className="text-xs text-amber-500 ml-1">(was {orig.weight}%)</span>}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={w.weight}
                    onChange={(e) => updateWeight(w.criterionId, parseFloat(e.target.value) || 0)}
                    className="w-16 text-right border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-amber-400"
                    aria-label={`Weight for ${crit?.name}`}
                  />
                  <span className="text-xs text-gray-400">%</span>
                </div>
              );
            })}

            {/* Constraints */}
            {scenarioConstraints.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-500 uppercase mt-3">Constraints</p>
                {scenarioConstraints.map((con) => {
                  const crit = input.criteria.find((c) => c.id === con.criterionId);
                  const orig = input.constraints.find((oc) => oc.id === con.id);
                  const changed = orig && orig.value !== con.value;
                  return (
                    <div key={con.id} className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm flex-1 ${changed ? 'font-semibold text-amber-700' : 'text-gray-700'}`}>
                        {crit?.name} {con.operator}
                        {changed && <span className="text-xs text-amber-500 ml-1">(was {orig.value})</span>}
                      </span>
                      <input
                        type="number"
                        value={con.value}
                        onChange={(e) => updateConstraint(con.id, 'value', parseFloat(e.target.value) || 0)}
                        className="w-24 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-amber-400"
                        aria-label={`Threshold for ${crit?.name} constraint`}
                      />
                      <span className="text-xs text-gray-400">{crit?.unit}</span>
                    </div>
                  );
                })}
              </>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <Button onClick={handleCalculate} disabled={!weightValid}>
          <RefreshCw className="w-4 h-4" /> Calculate Scenario
        </Button>
        <Button variant="secondary" onClick={handleReset}>
          Reset to Original
        </Button>
        {calculated && scenarioResult && !saved && (
          <Button variant="success" onClick={handleApplyScenario}>
            <Save className="w-4 h-4" /> Apply Scenario &amp; Save
          </Button>
        )}
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-700 font-medium">
            <Check className="w-4 h-4" /> Saved!
          </span>
        )}
      </div>

      {/* Scenario Result */}
      {calculated && scenarioResult && (
        <div className="space-y-4">
          {/* Change indicator */}
          {recommendationChanged ? (
            <Alert variant="warning">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Recommendation changed!</span>{' '}
                Baseline winner was <strong>{baseWinner ?? 'None'}</strong>, but with scenario weights/constraints the winner is now <strong>{scenarioWinner ?? 'None'}</strong>.
              </div>
            </Alert>
          ) : (
            <Alert variant="success">
              <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
              Recommendation unchanged. <strong>{scenarioWinner ?? 'No winner'}</strong> remains the top choice.
            </Alert>
          )}

          {/* Comparison table with score differences */}
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-gray-900">Scenario vs. Baseline Comparison</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Score Δ = scenario score minus baseline score. Positive = improved, negative = worsened.
              </p>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Option</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Baseline Score</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Scenario Score</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Score Δ</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Scenario Status</th>
                  </tr>
                </thead>
                <tbody>
                  {input.alternatives.map((alt) => {
                    const baseR = baseResult?.rankedResults.find((r) => r.alternative.id === alt.id);
                    const scenR = scenarioResult.rankedResults.find((r) => r.alternative.id === alt.id);
                    const isBaseWin = baseResult?.recommendation?.alternative.id === alt.id;
                    const isScenWin = scenarioResult.recommendation?.alternative.id === alt.id;

                    const baseScore = baseR?.feasible ? baseR.totalScore : null;
                    const scenScore = scenR?.feasible ? scenR.totalScore : null;
                    const delta = baseScore !== null && scenScore !== null ? scenScore - baseScore : null;

                    return (
                      <tr key={alt.id} className="border-b border-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-900">{alt.name}</td>
                        <td className="px-5 py-3">
                          {isBaseWin && <Badge variant="success" className="mr-1">Winner</Badge>}
                          <span className="font-medium">{baseScore !== null ? `${baseScore.toFixed(1)}/100` : '—'}</span>
                        </td>
                        <td className="px-5 py-3 font-medium">
                          {scenScore !== null ? `${scenScore.toFixed(1)}/100` : '—'}
                        </td>
                        <td className="px-5 py-3 font-bold">
                          {delta !== null ? (
                            <span className={delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-gray-400'}>
                              {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-5 py-3">
                          {isScenWin && <Badge variant="success">Winner</Badge>}
                          {!isScenWin && scenR?.feasible && <Badge variant="indigo">Feasible</Badge>}
                          {!scenR?.feasible && <Badge variant="danger">Infeasible</Badge>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Explanation */}
          {scenarioResult.explanation && (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-gray-700">Scenario Explanation</h2>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-gray-700 leading-relaxed">{scenarioResult.explanation}</p>
                {scenarioResult.criterionExplanations.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {scenarioResult.criterionExplanations.map((exp, i) => (
                      <div key={i} className="text-xs text-gray-600 bg-gray-50 rounded px-3 py-2 border border-gray-100">
                        {exp}
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* No feasible options */}
          {scenarioResult.noFeasibleOption && (
            <Alert variant="danger">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              No alternative is feasible under the scenario constraints. Try relaxing a constraint.
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};

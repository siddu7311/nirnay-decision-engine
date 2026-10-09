import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, ArrowRight, ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { StepProgress } from '../components/StepProgress';
import { Card, CardBody, CardHeader, Button, Input, Select, Alert, Badge } from '../components/ui';
import { getDecision, saveDecision } from '../lib/storage';
import { saveDraft, loadDraft } from '../lib/draftStore';
import { runDecisionEngine } from '../lib/decisionEngine';
import type {
  Alternative,
  Criterion,
  CriterionWeight,
  Constraint,
  ConstraintOperator,
  ValueMatrix,
  DecisionInput,
  SavedDecision,
} from '../types/decision';

// ============================================================
// Step definitions
// ============================================================
const STEPS = [
  { label: 'Options' },
  { label: 'Objectives' },
  { label: 'Priorities' },
  { label: 'Constraints' },
  { label: 'Evaluate' },
  { label: 'Review' },
];

const OPERATORS: { value: ConstraintOperator; label: string }[] = [
  { value: '<',  label: '<' },
  { value: '<=', label: '≤' },
  { value: '=',  label: '=' },
  { value: '>=', label: '≥' },
  { value: '>',  label: '>' },
];

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ============================================================
// EditDecision — pre-populated wizard for existing decisions
// URL: /decision/:id/edit?step=N  (step is 0-based, optional)
// ============================================================
export const EditDecision: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialStep = Math.max(0, Math.min(5, parseInt(searchParams.get('step') ?? '0', 10)));

  const [step, setStep] = useState(initialStep);
  const [ready, setReady] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [decisionName, setDecisionName] = useState('');
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [weights, setWeights] = useState<CriterionWeight[]>([]);
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [values, setValues] = useState<ValueMatrix>({});

  // ---- Load from draft → saved decision on mount ----
  useEffect(() => {
    if (!id) { setNotFound(true); return; }

    // Draft takes priority over saved state (user may have partially edited)
    const draft = loadDraft(id);
    const saved = getDecision(id);

    if (!saved && !draft) { setNotFound(true); return; }

    if (draft) {
      setDecisionName(draft.name);
      setAlternatives(draft.alternatives);
      setCriteria(draft.criteria);
      setWeights(draft.weights);
      setConstraints(draft.constraints);
      setValues(draft.values);
    } else if (saved) {
      setDecisionName(saved.name);
      setAlternatives(saved.input.alternatives);
      setCriteria(saved.input.criteria);
      setWeights(saved.input.weights);
      setConstraints(saved.input.constraints);
      setValues(saved.input.values);
    }
    setReady(true);
  }, [id]);

  // ---- Persist draft on every state change ----
  useEffect(() => {
    if (!ready || !id) return;
    saveDraft({ id, name: decisionName, alternatives, criteria, weights, constraints, values });
  }, [ready, id, decisionName, alternatives, criteria, weights, constraints, values]);

  // ---- Weight sync ----
  const syncWeights = useCallback((crits: Criterion[]) => {
    setWeights((prev) => {
      const equal = Math.floor(100 / crits.length);
      const remainder = 100 - equal * crits.length;
      return crits.map((c, i) => {
        const existing = prev.find((w) => w.criterionId === c.id);
        if (existing) return existing;
        return { criterionId: c.id, weight: equal + (i === 0 ? remainder : 0) };
      });
    });
  }, []);

  // ---- Recalculate & save ----
  const handleRecalculate = () => {
    if (!id) return;
    const input: DecisionInput = { alternatives, criteria, weights, constraints, values };
    const result = runDecisionEngine(input);
    const existing = getDecision(id);
    const updated: SavedDecision = {
      id,
      name: decisionName.trim() || existing?.name || existing?.input?.alternatives?.[0]?.name || 'Decision',
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      input,
      result,
    };
    saveDecision(updated);
    navigate(`/decision/${id}/results`);
  };

  const goNext = () => {
    if (step === 1) syncWeights(criteria);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  if (notFound) {
    return (
      <div className="p-6">
        <Alert variant="danger">Decision not found.</Alert>
        <Button variant="secondary" onClick={() => navigate('/')} className="mt-4">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Button>
      </div>
    );
  }

  if (!ready) {
    return <div className="p-6 text-sm text-gray-500">Loading decision…</div>;
  }

  const stepProps = {
    alternatives, setAlternatives,
    criteria, setCriteria,
    weights, setWeights,
    constraints, setConstraints,
    values, setValues,
    syncWeights,
  };

  const weightTotal = weights.reduce((s, w) => s + w.weight, 0);
  const weightValid = Math.abs(weightTotal - 100) < 0.01;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-2 flex items-center gap-3">
        <button
          onClick={() => navigate(`/decision/${id}/results`)}
          className="text-sm text-gray-500 hover:text-indigo-700 flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Results
        </button>
      </div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Edit Decision</h1>
        <p className="text-sm text-gray-500 mt-1">
          All your data is preserved. Modify and recalculate when ready.
        </p>
      </div>

      {/* Decision name */}
      <Card className="mb-5">
        <CardBody>
          <Input
            label="Decision Name"
            value={decisionName}
            onChange={(e) => setDecisionName(e.target.value)}
          />
        </CardBody>
      </Card>

      {/* Step progress */}
      <div className="mb-6">
        <StepProgress steps={STEPS} currentStep={step} />
      </div>

      {/* Step content */}
      {step === 0 && <EditStepOptions {...stepProps} />}
      {step === 1 && <EditStepObjectives {...stepProps} />}
      {step === 2 && <EditStepPriorities {...stepProps} />}
      {step === 3 && <EditStepConstraints {...stepProps} />}
      {step === 4 && <EditStepEvaluate {...stepProps} />}
      {step === 5 && <EditStepReview alternatives={alternatives} criteria={criteria} weights={weights} constraints={constraints} onRecalculate={handleRecalculate} />}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button variant="secondary" onClick={goBack} disabled={step === 0}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={goNext}>
            Next <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button variant="success" onClick={handleRecalculate} disabled={!weightValid}>
            <RefreshCw className="w-4 h-4" /> Recalculate Decision
          </Button>
        )}
      </div>
    </div>
  );
};

// ============================================================
// Shared step props
// ============================================================
interface StepProps {
  alternatives: Alternative[];
  setAlternatives: React.Dispatch<React.SetStateAction<Alternative[]>>;
  criteria: Criterion[];
  setCriteria: React.Dispatch<React.SetStateAction<Criterion[]>>;
  weights: CriterionWeight[];
  setWeights: React.Dispatch<React.SetStateAction<CriterionWeight[]>>;
  constraints: Constraint[];
  setConstraints: React.Dispatch<React.SetStateAction<Constraint[]>>;
  values: ValueMatrix;
  setValues: React.Dispatch<React.SetStateAction<ValueMatrix>>;
  syncWeights: (crits: Criterion[]) => void;
}

// ============================================================
// Step 1 — Options
// ============================================================
const EditStepOptions: React.FC<StepProps> = ({ alternatives, setAlternatives }) => {
  const addAlt = () => {
    if (alternatives.length >= 10) return;
    setAlternatives((prev) => [...prev, { id: uid(), name: '', description: '' }]);
  };
  const removeAlt = (id: string) => {
    if (alternatives.length <= 3) return;
    setAlternatives((prev) => prev.filter((a) => a.id !== id));
  };
  const update = (id: string, field: keyof Alternative, val: string) =>
    setAlternatives((prev) => prev.map((a) => a.id === id ? { ...a, [field]: val } : a));

  const hasDuplicates = new Set(alternatives.map((a) => a.name.trim().toLowerCase())).size < alternatives.filter(a => a.name.trim()).length;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-gray-900">Step 1 — Options</h2>
        <p className="text-xs text-gray-500 mt-0.5">Minimum 3, maximum 10 alternatives.</p>
      </CardHeader>
      <CardBody className="space-y-3">
        {hasDuplicates && (
          <Alert variant="warning"><AlertCircle className="w-4 h-4 flex-shrink-0" /> Two or more options have the same name.</Alert>
        )}
        {alternatives.map((alt, idx) => (
          <div key={alt.id} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-1">
              {idx + 1}
            </div>
            <div className="flex-1 space-y-2">
              <Input placeholder="Option name" value={alt.name} onChange={(e) => update(alt.id, 'name', e.target.value)} />
              <Input placeholder="Short description (optional)" value={alt.description} onChange={(e) => update(alt.id, 'description', e.target.value)} />
            </div>
            <button onClick={() => removeAlt(alt.id)} disabled={alternatives.length <= 3}
              className="text-gray-400 hover:text-red-500 disabled:opacity-30 mt-1 p-1 rounded">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={addAlt} disabled={alternatives.length >= 10}>
          <Plus className="w-4 h-4" /> Add Option
        </Button>
      </CardBody>
    </Card>
  );
};

// ============================================================
// Step 2 — Objectives
// ============================================================
const EditStepObjectives: React.FC<StepProps> = ({ criteria, setCriteria }) => {
  const addCrit = () => {
    if (criteria.length >= 8) return;
    setCriteria((prev) => [...prev, { id: uid(), name: '', description: '', unit: '', direction: 'higher_is_better' }]);
  };
  const removeCrit = (id: string) => {
    if (criteria.length <= 3) return;
    setCriteria((prev) => prev.filter((c) => c.id !== id));
  };
  const update = (id: string, field: keyof Criterion, val: string) =>
    setCriteria((prev) => prev.map((c) => c.id === id ? { ...c, [field]: val } : c));

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-gray-900">Step 2 — Objectives / Criteria</h2>
        <p className="text-xs text-gray-500 mt-0.5">Minimum 3, maximum 8 criteria.</p>
      </CardHeader>
      <CardBody className="space-y-3">
        {criteria.map((crit, idx) => (
          <div key={crit.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</div>
              <button onClick={() => removeCrit(crit.id)} disabled={criteria.length <= 3}
                className="ml-auto text-gray-400 hover:text-red-500 disabled:opacity-30 p-1 rounded">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Name (e.g. Price)" value={crit.name} onChange={(e) => update(crit.id, 'name', e.target.value)} />
              <Input placeholder="Unit (e.g. ₹, min)" value={crit.unit} onChange={(e) => update(crit.id, 'unit', e.target.value)} />
            </div>
            <Input placeholder="Description (optional)" value={crit.description} onChange={(e) => update(crit.id, 'description', e.target.value)} />
            <Select value={crit.direction} onChange={(e) => update(crit.id, 'direction', e.target.value)}>
              <option value="lower_is_better">Lower is Better</option>
              <option value="higher_is_better">Higher is Better</option>
            </Select>
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={addCrit} disabled={criteria.length >= 8}>
          <Plus className="w-4 h-4" /> Add Criterion
        </Button>
      </CardBody>
    </Card>
  );
};

// ============================================================
// Step 3 — Priorities
// ============================================================
const EditStepPriorities: React.FC<StepProps> = ({ criteria, weights, setWeights }) => {
  const total = weights.reduce((s, w) => s + w.weight, 0);
  const valid = Math.abs(total - 100) < 0.01;

  const update = (id: string, val: number) =>
    setWeights((prev) => prev.map((w) => w.criterionId === id ? { ...w, weight: val } : w));

  const equalize = () => {
    const eq = Math.floor(100 / criteria.length);
    const rem = 100 - eq * criteria.length;
    setWeights(criteria.map((c, i) => ({ criterionId: c.id, weight: eq + (i === 0 ? rem : 0) })));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Step 3 — Priorities / Weights</h2>
            <p className="text-xs text-gray-500 mt-0.5">Total must equal exactly 100%.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={equalize}>Equalize</Button>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        {!valid && (
          <Alert variant="warning">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Total weight is {total.toFixed(1)}% — must equal 100%.
          </Alert>
        )}
        {criteria.map((crit) => {
          const w = weights.find((x) => x.criterionId === crit.id);
          const pct = w?.weight ?? 0;
          return (
            <div key={crit.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">{crit.name || `Criterion ${criteria.indexOf(crit) + 1}`}</label>
                <div className="flex items-center gap-2">
                  <input type="number" min={0} max={100} value={pct}
                    onChange={(e) => update(crit.id, parseFloat(e.target.value) || 0)}
                    className="w-16 text-right px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500" />
                  <span className="text-sm text-gray-500 w-4">%</span>
                </div>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
            </div>
          );
        })}
        <div className={`flex items-center justify-between pt-2 border-t ${valid ? 'border-green-200' : 'border-amber-200'}`}>
          <span className="text-sm font-semibold text-gray-700">Total</span>
          <Badge variant={valid ? 'success' : 'warning'}>{total.toFixed(1)}% {valid ? '✓' : '≠ 100%'}</Badge>
        </div>
      </CardBody>
    </Card>
  );
};

// ============================================================
// Step 4 — Constraints
// ============================================================
const EditStepConstraints: React.FC<StepProps> = ({ criteria, constraints, setConstraints }) => {
  const addConstraint = () => {
    if (criteria.length === 0) return;
    setConstraints((prev) => [...prev, { id: uid(), criterionId: criteria[0].id, operator: '<=', value: 0 }]);
  };
  const remove = (id: string) => setConstraints((prev) => prev.filter((c) => c.id !== id));
  const update = (id: string, field: keyof Constraint, val: string | number) =>
    setConstraints((prev) => prev.map((c) => c.id === id ? { ...c, [field]: val } : c));

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-gray-900">Step 4 — Constraints</h2>
        <p className="text-xs text-gray-500 mt-0.5">Hard requirements. Violations exclude an option before scoring.</p>
      </CardHeader>
      <CardBody className="space-y-3">
        {constraints.length === 0 && (
          <Alert variant="info"><AlertCircle className="w-4 h-4 flex-shrink-0" /> No constraints — all alternatives will be scored.</Alert>
        )}
        {constraints.map((con) => {
          const crit = criteria.find((c) => c.id === con.criterionId);
          return (
            <div key={con.id} className="flex gap-2 items-end p-3 bg-gray-50 rounded-lg flex-wrap">
              <div className="flex-1 min-w-[120px]">
                <label className="text-xs text-gray-500 mb-1 block">Criterion</label>
                <select value={con.criterionId} onChange={(e) => update(con.id, 'criterionId', e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500">
                  {criteria.map((c) => <option key={c.id} value={c.id}>{c.name || '(unnamed)'}</option>)}
                </select>
              </div>
              <div className="w-16">
                <label className="text-xs text-gray-500 mb-1 block">Operator</label>
                <select value={con.operator} onChange={(e) => update(con.id, 'operator', e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500">
                  {OPERATORS.map((op) => <option key={op.value} value={op.value}>{op.label}</option>)}
                </select>
              </div>
              <div className="w-28">
                <label className="text-xs text-gray-500 mb-1 block">Value {crit?.unit ? `(${crit.unit})` : ''}</label>
                <input type="number" value={con.value}
                  onChange={(e) => update(con.id, 'value', parseFloat(e.target.value) || 0)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button onClick={() => remove(con.id)} className="text-gray-400 hover:text-red-500 mb-0.5 p-1 rounded">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
        <Button variant="ghost" size="sm" onClick={addConstraint}>
          <Plus className="w-4 h-4" /> Add Constraint
        </Button>
      </CardBody>
    </Card>
  );
};

// ============================================================
// Step 5 — Evaluate (value matrix)
// ============================================================
const EditStepEvaluate: React.FC<StepProps> = ({ alternatives, criteria, values, setValues }) => {
  const update = (altId: string, critId: string, val: string) => {
    setValues((prev) => ({
      ...prev,
      [altId]: { ...(prev[altId] ?? {}), [critId]: parseFloat(val) || 0 },
    }));
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-gray-900">Step 5 — Values</h2>
        <p className="text-xs text-gray-500 mt-0.5">Edit the raw value for each alternative on each criterion.</p>
      </CardHeader>
      <CardBody>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 whitespace-nowrap">Option</th>
                {criteria.map((c) => (
                  <th key={c.id} className="text-left py-2 px-2 text-xs font-semibold text-gray-500 whitespace-nowrap">
                    {c.name || '(unnamed)'}
                    {c.unit && <span className="text-gray-400 font-normal ml-1">({c.unit})</span>}
                    <div className="text-[10px] text-gray-400 font-normal">
                      {c.direction === 'lower_is_better' ? '↓ lower = better' : '↑ higher = better'}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alternatives.map((alt) => (
                <tr key={alt.id} className="border-t border-gray-100">
                  <td className="py-2 pr-4 font-medium text-gray-800 whitespace-nowrap">{alt.name || '(unnamed)'}</td>
                  {criteria.map((c) => (
                    <td key={c.id} className="py-2 px-2">
                      <input type="number"
                        value={values[alt.id]?.[c.id] ?? ''}
                        onChange={(e) => update(alt.id, c.id, e.target.value)}
                        className="w-24 text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500"
                        placeholder="0" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
};

// ============================================================
// Step 6 — Review & Recalculate
// ============================================================
const EditStepReview: React.FC<{
  alternatives: Alternative[];
  criteria: Criterion[];
  weights: CriterionWeight[];
  constraints: Constraint[];
  onRecalculate: () => void;
}> = ({ alternatives, criteria, weights, constraints }) => {
  const total = weights.reduce((s, w) => s + w.weight, 0);
  const valid = Math.abs(total - 100) < 0.01;
  const issues: string[] = [];
  if (!alternatives.every((a) => a.name.trim())) issues.push('Some options are missing names.');
  if (!criteria.every((c) => c.name.trim())) issues.push('Some criteria are missing names.');
  if (!valid) issues.push(`Total weight is ${total.toFixed(1)}% — must be 100%.`);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-gray-900">Step 6 — Review & Recalculate</h2>
        <p className="text-xs text-gray-500 mt-0.5">Review changes before recalculating the decision.</p>
      </CardHeader>
      <CardBody className="space-y-4">
        {issues.length > 0 && (
          <Alert variant="danger">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Fix before recalculating:</p>
              <ul className="mt-1 text-xs space-y-0.5">{issues.map((i) => <li key={i}>• {i}</li>)}</ul>
            </div>
          </Alert>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Options', val: alternatives.length },
            { label: 'Criteria', val: criteria.length },
            { label: 'Constraints', val: constraints.length },
            { label: 'Weights total', val: `${total.toFixed(0)}%`, ok: valid },
          ].map(({ label, val, ok }) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
              <div className={`text-xl font-bold ${ok === false ? 'text-red-600' : ok === true ? 'text-green-600' : 'text-gray-900'}`}>{val}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
        <div className="text-sm text-gray-600 bg-indigo-50 rounded-lg p-3 border border-indigo-100">
          NIRNAY will rerun constraint filtering, normalization, weighted scoring, and ranking with your updated inputs.
        </div>
      </CardBody>
    </Card>
  );
};

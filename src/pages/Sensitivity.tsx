import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { getDecision } from '../lib/storage';
import { runSensitivityAnalysis } from '../lib/sensitivity';
import { Card, CardBody, CardHeader, Button, Alert, Select, PageHeader, Badge } from '../components/ui';
import type { SavedDecision, SensitivityResult } from '../types/decision';

export const Sensitivity: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [decision, setDecision] = useState<SavedDecision | null>(null);
  const [selectedCriterionId, setSelectedCriterionId] = useState<string>('');
  const [sensitivityResult, setSensitivityResult] = useState<SensitivityResult | null>(null);

  useEffect(() => {
    if (id) {
      const d = getDecision(id);
      if (d) {
        setDecision(d);
        if (d.input.criteria.length > 0) {
          setSelectedCriterionId(d.input.criteria[0].id);
        }
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

  const handleAnalyze = () => {
    if (!selectedCriterionId) return;
    const result = runSensitivityAnalysis(decision.input, selectedCriterionId);
    setSensitivityResult(result);
  };

  const { input } = decision;
  const criterion = input.criteria.find((c) => c.id === selectedCriterionId);

  // Build chart data
  const allAlternatives = input.alternatives.map((a) => a.name);
  const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const chartData = sensitivityResult?.points.map((p) => {
    const row: Record<string, number | string> = { weight: p.weight };
    for (const name of allAlternatives) {
      row[name] = p.scores[name] ?? 0;
    }
    return row;
  }) ?? [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Sensitivity Analysis"
        subtitle={`How does changing one criterion's weight affect the recommendation?`}
        action={
          <Button variant="secondary" size="sm" onClick={() => navigate(`/decision/${id}/results`)}>
            <ArrowLeft className="w-3 h-3" /> Back to Results
          </Button>
        }
      />

      {/* Setup */}
      <Card className="mb-5">
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900">Select Criterion to Vary</h2>
        </CardHeader>
        <CardBody className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Select
              label="Criterion"
              value={selectedCriterionId}
              onChange={(e) => {
                setSelectedCriterionId(e.target.value);
                setSensitivityResult(null);
              }}
            >
              {input.criteria.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <Button onClick={handleAnalyze} disabled={!selectedCriterionId}>
            <RefreshCw className="w-4 h-4" /> Run Analysis
          </Button>
        </CardBody>
      </Card>

      {sensitivityResult && (
        <div className="space-y-5">
          {/* Threshold explanation */}
          {sensitivityResult.thresholds.length > 0 ? (
            <Alert variant="warning">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Recommendation is sensitive to {criterion?.name} weight.</span>
                <div className="mt-1 space-y-0.5">
                  {sensitivityResult.thresholds.map((t, i) => (
                    <div key={i} className="text-xs">
                      At <strong>{t.weight}%</strong>: recommendation changes from <strong>{t.from}</strong> → <strong>{t.to}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </Alert>
          ) : (
            <Alert variant="success">
              <div>
                <span className="font-semibold">Recommendation is robust.</span>{' '}
                The winner does not change as {criterion?.name} weight varies from 5% to 80%.
              </div>
            </Alert>
          )}

          {/* Weight → Winner table */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-900">Weight → Winner Mapping</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                For each {criterion?.name} weight, remaining weights are redistributed proportionally.
              </p>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{criterion?.name} Weight</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Winner</th>
                    {allAlternatives.map((name) => (
                      <th key={name} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">{name} Score</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sensitivityResult.points.map((p) => (
                    <tr key={p.weight} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-2 font-medium">{p.weight}%</td>
                      <td className="px-5 py-2">
                        {p.winner ? (
                          <Badge variant="success">{p.winner}</Badge>
                        ) : (
                          <Badge variant="danger">No winner</Badge>
                        )}
                      </td>
                      {allAlternatives.map((name) => (
                        <td key={name} className="px-5 py-2 text-gray-600 hidden sm:table-cell">
                          {p.scores[name] !== undefined ? p.scores[name].toFixed(1) : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Line chart */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-900">Score vs. {criterion?.name} Weight</h2>
              <p className="text-xs text-gray-500">How each alternative's score changes as the weight varies</p>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="weight"
                    tickFormatter={(v) => `${v}%`}
                    label={{ value: `${criterion?.name} Weight (%)`, position: 'insideBottom', offset: -10, fontSize: 12 }}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}`} />
                  <Tooltip
                    formatter={(v, name) => [typeof v === 'number' ? `${v.toFixed(1)}/100` : String(v), String(name ?? '')]}
                    labelFormatter={(v) => `${criterion?.name}: ${v}%`}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {allAlternatives.map((name, i) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                  {sensitivityResult.thresholds.map((t, i) => (
                    <ReferenceLine
                      key={i}
                      x={t.weight}
                      stroke="#f59e0b"
                      strokeDasharray="4 3"
                      label={{ value: `Change at ${t.weight}%`, position: 'top', fontSize: 10, fill: '#b45309' }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  PlayCircle,
  Scale,
  TrendingUp,
  History,
  Award,
  ChevronRight,
  Target,
} from 'lucide-react';
import { getAllDecisions, saveDecision } from '../lib/storage';
import { runDecisionEngine } from '../lib/decisionEngine';
import { DEMO_INPUT, DEMO_DECISION_NAME } from '../data/demo';
import { Card, CardBody, Button, Badge, PageHeader, EmptyState } from '../components/ui';
import type { SavedDecision } from '../types/decision';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [decisions, setDecisions] = useState<SavedDecision[]>([]);

  useEffect(() => {
    setDecisions(getAllDecisions());
  }, []);

  const handleLoadDemo = () => {
    const result = runDecisionEngine(DEMO_INPUT);
    const demo: SavedDecision = {
      id: 'demo-' + Date.now(),
      name: DEMO_DECISION_NAME,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      input: DEMO_INPUT,
      result,
    };
    saveDecision(demo);
    navigate(`/decision/${demo.id}/results`);
  };

  const recent = decisions.slice(0, 5);
  const lastRec = decisions.find((d) => d.result?.recommendation)?.result?.recommendation?.alternative.name;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Hero */}
      <div className="mb-8 flex items-start gap-4">
        <div className="w-12 h-12 bg-indigo-700 rounded-xl flex items-center justify-center flex-shrink-0">
          <Scale className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            Welcome to <span className="text-indigo-700">NIRNAY</span>
          </h1>
          <p className="mt-1 text-gray-500">Make complex choices with clarity. From choices to confident decisions.</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Target className="w-5 h-5 text-indigo-600" />}
          label="Total Decisions"
          value={decisions.length.toString()}
          bg="bg-indigo-50"
        />
        <StatCard
          icon={<History className="w-5 h-5 text-blue-600" />}
          label="Recent (30 days)"
          value={decisions.filter((d) => {
            const age = Date.now() - new Date(d.updatedAt).getTime();
            return age < 30 * 86400 * 1000;
          }).length.toString()}
          bg="bg-blue-50"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-green-600" />}
          label="With Results"
          value={decisions.filter((d) => d.result !== null).length.toString()}
          bg="bg-green-50"
        />
        <StatCard
          icon={<Award className="w-5 h-5 text-amber-600" />}
          label="Last Recommendation"
          value={lastRec ?? '—'}
          bg="bg-amber-50"
          small
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Button onClick={() => navigate('/new')} size="lg" className="gap-2">
          <PlusCircle className="w-4 h-4" />
          Create New Decision
        </Button>
        <Button variant="secondary" onClick={handleLoadDemo} size="lg" className="gap-2">
          <PlayCircle className="w-4 h-4" />
          Load Demo
        </Button>
      </div>

      {/* Recent decisions */}
      <div>
        <PageHeader
          title="Recent Decisions"
          action={
            decisions.length > 0 ? (
              <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
                View all <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            ) : undefined
          }
        />

        {recent.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon={<Scale className="w-12 h-12" />}
                title="No decisions yet"
                description="Create your first decision or load the demo to see NIRNAY in action."
                action={
                  <div className="flex gap-3">
                    <Button onClick={() => navigate('/new')} size="sm">
                      <PlusCircle className="w-3 h-3" /> New Decision
                    </Button>
                    <Button variant="secondary" onClick={handleLoadDemo} size="sm">
                      <PlayCircle className="w-3 h-3" /> Load Demo
                    </Button>
                  </div>
                }
              />
            </CardBody>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Decision</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Alternatives</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recommendation</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((d) => (
                    <tr
                      key={d.id}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(d.result ? `/decision/${d.id}/results` : `/decision/${d.id}`)}
                    >
                      <td className="px-5 py-3 font-medium text-gray-900">{d.name}</td>
                      <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">
                        {new Date(d.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{d.input.alternatives.length}</td>
                      <td className="px-5 py-3">
                        {d.result?.recommendation ? (
                          <Badge variant="success">{d.result.recommendation.alternative.name}</Badge>
                        ) : d.result?.noFeasibleOption ? (
                          <Badge variant="danger">No Feasible Option</Badge>
                        ) : (
                          <Badge variant="gray">No Result</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-400">
                        <ChevronRight className="w-4 h-4" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* How it works teaser */}
      <Card className="mt-8 bg-gradient-to-r from-indigo-50 to-white border-indigo-100">
        <CardBody className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900">How does NIRNAY work?</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Every recommendation is calculated by a transparent decision engine — no black boxes, no AI guessing.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/how')}>
            Learn the methodology <ChevronRight className="w-3 h-3" />
          </Button>
        </CardBody>
      </Card>
    </div>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  bg: string;
  small?: boolean;
}> = ({ icon, label, value, bg, small }) => (
  <Card className="p-4">
    <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-2`}>
      {icon}
    </div>
    <div className="text-xs text-gray-500 font-medium">{label}</div>
    <div className={`font-bold text-gray-900 mt-0.5 truncate ${small ? 'text-base' : 'text-xl'}`}>{value}</div>
  </Card>
);

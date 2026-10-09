import React from 'react';
import { Scale, Target, Zap, Shield, BarChart2, GitBranch } from 'lucide-react';
import { Card, CardBody, PageHeader, Badge } from '../components/ui';

const Feature: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0 w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
      {icon}
    </div>
    <div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 mt-0.5">{description}</p>
    </div>
  </div>
);

export const About: React.FC = () => {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader title="About NIRNAY" subtitle="The transparent decision engine." />

      {/* Brand card */}
      <Card className="mb-6 bg-gradient-to-br from-indigo-700 to-indigo-900 border-indigo-600">
        <CardBody className="py-8 text-center">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Scale className="w-7 h-7 text-white" />
          </div>
          <div className="text-3xl font-extrabold text-white tracking-wide">NIRNAY</div>
          <div className="text-xs text-indigo-300 tracking-widest uppercase mt-1">The Decision Engine</div>
          <p className="text-indigo-200 text-sm mt-4 max-w-md mx-auto leading-relaxed">
            "From choices to confident decisions."
          </p>
          <p className="text-indigo-300 text-xs mt-2">
            Evaluate alternatives, understand trade-offs, and make decisions backed by transparent logic.
          </p>
        </CardBody>
      </Card>

      {/* What is NIRNAY */}
      <Card className="mb-5">
        <CardBody>
          <h2 className="text-base font-semibold text-gray-900 mb-3">What is NIRNAY?</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            <strong>Nirnay</strong> (निर्णय) means <em>"Decision"</em> in Sanskrit and Hindi. NIRNAY is a
            transparent decision-support system that helps you evaluate multiple alternatives against competing
            objectives, priorities, and constraints.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed mt-3">
            Unlike black-box AI systems, NIRNAY shows you exactly why it makes each recommendation:
            the raw values, normalized scores, weighted contributions, constraint checks, trade-offs,
            and a plain-English explanation — all derived from your own inputs.
          </p>
        </CardBody>
      </Card>

      {/* Core problem */}
      <Card className="mb-5">
        <CardBody>
          <h2 className="text-base font-semibold text-gray-900 mb-3">The Problem NIRNAY Solves</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Real decisions involve multiple alternatives, competing criteria, different priorities, and hard
            constraints. Most people either rely on gut feeling or get overwhelmed by the complexity.
            NIRNAY brings structure to this process: define what matters, assign priorities, set constraints,
            and let the engine calculate the optimal choice — transparently.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
            {[
              'What are the available choices?',
              'What objectives matter?',
              'How important is each objective?',
              'What constraints must be satisfied?',
              'Which options are feasible?',
              'How does each option score?',
              'Which option ranks highest?',
              'Why did it win?',
            ].map((q) => (
              <div key={q} className="flex gap-2">
                <span className="text-indigo-500 flex-shrink-0">→</span>
                <span>{q}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Features */}
      <Card className="mb-5">
        <CardBody>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Key Features</h2>
          <div className="space-y-5">
            <Feature icon={<Target className="w-5 h-5" />} title="Multi-Criteria Decision Analysis" description="Define any number of criteria with custom directions, units, and weights." />
            <Feature icon={<Shield className="w-5 h-5" />} title="Hard Constraint Filtering" description="Any option that violates a constraint is excluded before scoring. No exceptions." />
            <Feature icon={<Zap className="w-5 h-5" />} title="Transparent Scoring" description="Every score is derived from your data. View raw values, normalized scores, and weighted contributions." />
            <Feature icon={<GitBranch className="w-5 h-5" />} title="What-If Analysis" description="Change weights and constraints to explore how the recommendation changes in different scenarios." />
            <Feature icon={<BarChart2 className="w-5 h-5" />} title="Sensitivity Analysis" description="Vary a single criterion's weight across a range and see exactly where the recommendation changes." />
            <Feature icon={<Scale className="w-5 h-5" />} title="Trade-off Explanation" description="Understand what you gain and what you give up when choosing the recommended option." />
          </div>
        </CardBody>
      </Card>

      {/* Tech stack */}
      <Card className="mb-5">
        <CardBody>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Technology</h2>
          <div className="flex flex-wrap gap-2">
            {['React 19', 'TypeScript', 'Vite', 'Tailwind CSS 4', 'Recharts', 'Lucide Icons', 'LocalStorage'].map((tech) => (
              <Badge key={tech} variant="indigo">{tech}</Badge>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-3">
            No backend required. No external AI API. Runs entirely in the browser.
            Data is persisted to LocalStorage.
          </p>
        </CardBody>
      </Card>

      {/* Principle */}
      <Card className="bg-gray-50 border-gray-200">
        <CardBody className="text-center py-8">
          <p className="text-lg font-semibold text-gray-800 leading-relaxed max-w-lg mx-auto">
            "Don't just choose an option.<br/>
            <span className="text-indigo-700">Understand why it is the better decision.</span>"
          </p>
          <p className="text-xs text-gray-400 mt-4">NIRNAY — The Decision Engine · v1.0</p>
        </CardBody>
      </Card>
    </div>
  );
};

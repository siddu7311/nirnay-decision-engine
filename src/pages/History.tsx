import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trash2, Copy, Pencil, Check, X, History as HistoryIcon,
  PlusCircle, ChevronRight, Award, AlertTriangle
} from 'lucide-react';
import { getAllDecisions, deleteDecision, duplicateDecision, renameDecision } from '../lib/storage';
import { Card, CardBody, Button, Badge, PageHeader, EmptyState, Alert } from '../components/ui';
import type { SavedDecision } from '../types/decision';

export const History: React.FC = () => {
  const navigate = useNavigate();
  const [decisions, setDecisions] = useState<SavedDecision[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const refresh = () => setDecisions(getAllDecisions());

  useEffect(() => {
    refresh();
  }, []);

  const handleRename = (id: string, current: string) => {
    setEditingId(id);
    setEditName(current);
  };

  const confirmRename = (id: string) => {
    if (editName.trim()) {
      renameDecision(id, editName.trim());
      refresh();
    }
    setEditingId(null);
  };

  const handleDuplicate = (id: string) => {
    duplicateDecision(id);
    refresh();
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = (id: string) => {
    deleteDecision(id);
    setDeleteConfirm(null);
    refresh();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Decision History"
        subtitle="All saved decisions. Click to view results."
        action={
          <Button onClick={() => navigate('/new')} size="sm">
            <PlusCircle className="w-3 h-3" /> New Decision
          </Button>
        }
      />

      {deleteConfirm && (
        <Alert variant="danger" className="mb-5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex items-center gap-3 flex-1">
            <span className="text-sm">Are you sure you want to delete this decision?</span>
            <div className="flex gap-2 ml-auto">
              <Button variant="danger" size="sm" onClick={() => confirmDelete(deleteConfirm)}>Delete</Button>
              <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            </div>
          </div>
        </Alert>
      )}

      {decisions.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<HistoryIcon className="w-12 h-12" />}
              title="No saved decisions"
              description="Create a decision or load the demo to get started."
              action={
                <Button onClick={() => navigate('/new')} size="sm">
                  <PlusCircle className="w-3 h-3" /> New Decision
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {decisions.map((d) => (
            <Card key={d.id} className="hover:border-indigo-200 transition-colors">
              <CardBody className="flex items-center gap-4 flex-wrap">
                {/* Name / edit */}
                <div className="flex-1 min-w-0">
                  {editingId === d.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(d.id); if (e.key === 'Escape') setEditingId(null); }}
                        className="text-sm border border-indigo-400 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 flex-1"
                        autoFocus
                      />
                      <button onClick={() => confirmRename(d.id)} className="text-green-600 hover:text-green-800" aria-label="Confirm rename">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600" aria-label="Cancel rename">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer"
                      onClick={() => navigate(d.result ? `/decision/${d.id}/results` : `/decision/${d.id}`)}
                    >
                      <div className="font-semibold text-gray-900">{d.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {new Date(d.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {' · '}{d.input.alternatives.length} options · {d.input.criteria.length} criteria
                      </div>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {d.result?.recommendation ? (
                    <div className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-green-600" />
                      <Badge variant="success">{d.result.recommendation.alternative.name}</Badge>
                    </div>
                  ) : d.result?.noFeasibleOption ? (
                    <Badge variant="danger">No Feasible Option</Badge>
                  ) : d.result?.isTie ? (
                    <Badge variant="warning">Tie</Badge>
                  ) : (
                    <Badge variant="gray">No Result</Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleRename(d.id, d.name)}
                    className="p-1.5 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                    title="Rename"
                    aria-label="Rename decision"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(d.id)}
                    className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                    title="Duplicate"
                    aria-label="Duplicate decision"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                    title="Delete"
                    aria-label="Delete decision"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => navigate(d.result ? `/decision/${d.id}/results` : `/decision/${d.id}`)}
                    className="p-1.5 rounded text-gray-400 hover:text-gray-700"
                    title="Open"
                    aria-label="Open decision"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

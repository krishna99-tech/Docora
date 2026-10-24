'use client';

import React, { useState, useEffect } from 'react';
import {
  Workflow as WorkflowIcon,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Check,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Trigger modal
  const [selectedWf, setSelectedWf] = useState<any | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState<string | null>(null);

  // Approval decision modal
  const [selectedApproval, setSelectedApproval] = useState<any | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [deciding, setDeciding] = useState(false);

  // Create workflow modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newWfName, setNewWfName] = useState('');
  const [newWfDesc, setNewWfDesc] = useState('');
  const [newWfTrigger, setNewWfTrigger] = useState('manual');
  const [requireApprovalStep, setRequireApprovalStep] = useState(true);
  const [creatingWf, setCreatingWf] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wfRes, appRes] = await Promise.all([
        fetch('/api/v1/workflows'),
        fetch('/api/v1/workflows/approvals?status=pending'),
      ]);

      if (wfRes.ok) {
        const wfData = await wfRes.json();
        if (Array.isArray(wfData)) setWorkflows(wfData);
      }

      if (appRes.ok) {
        const appData = await appRes.json();
        if (Array.isArray(appData)) setApprovals(appData);
      }
    } catch {}
    setLoading(false);
  };

  const handleTrigger = async (wf: any) => {
    setTriggering(true);
    setTriggerMessage(null);

    try {
      const res = await fetch(`/api/v1/workflows/${wf.id}/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: { triggeredBy: 'UI Dashboard' } }),
      });

      if (!res.ok) {
        throw new Error('Failed to trigger workflow execution');
      }

      setTriggerMessage('Workflow execution successfully initiated!');
      fetchData();
    } catch (err: any) {
      setTriggerMessage(`Error: ${err.message}`);
    } finally {
      setTriggering(false);
    }
  };

  const handleDecision = async (status: 'approved' | 'rejected') => {
    if (!selectedApproval) return;
    setDeciding(true);

    try {
      const res = await fetch(`/api/v1/workflows/approvals/${selectedApproval.id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, decisionNotes }),
      });

      if (res.ok) {
        setSelectedApproval(null);
        setDecisionNotes('');
        fetchData();
      }
    } catch {}
    setDeciding(false);
  };

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWfName) return;
    setCreatingWf(true);

    const nodes = [
      { id: 'node_start', type: 'start', label: 'Start' },
      { id: 'node_validate', type: 'validate', label: 'Validate Data' },
    ];
    if (requireApprovalStep) {
      nodes.push({ id: 'node_approval', type: 'approval', label: 'Executive Approval' });
    }
    nodes.push({ id: 'node_complete', type: 'complete', label: 'Complete & Archive' });

    try {
      const res = await fetch('/api/v1/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWfName,
          description: newWfDesc,
          triggerType: newWfTrigger,
          definition: { nodes },
          isActive: true,
        }),
      });

      if (res.ok) {
        setIsCreateOpen(false);
        setNewWfName('');
        setNewWfDesc('');
        fetchData();
      }
    } catch {}
    setCreatingWf(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <WorkflowIcon className="w-5 h-5 text-[var(--foreground)]" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Workflow Automation</h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-1">
            Build document workflows, manage state machine executions, and approve review steps.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold h-9"
        >
          <Plus className="w-4 h-4 mr-1.5" /> New Workflow
        </Button>
      </div>

      {/* Pending In-App Approvals Notification Panel */}
      {approvals.length > 0 && (
        <div className="border border-amber-900/50 bg-amber-950/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-amber-200">
              Pending Document Approvals ({approvals.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {approvals.map((app) => (
              <div
                key={app.id}
                className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-semibold text-sm">{app.workflowName || 'Document Approval'}</div>
                  <div className="text-[11px] text-[var(--muted-foreground)]">Step: {app.stepId}</div>
                  <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                    Requested: {new Date(app.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedApproval(app);
                    setDecisionNotes('');
                  }}
                  className="bg-white text-black hover:bg-neutral-200 text-xs font-semibold h-8"
                >
                  Review
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workflows List */}
      <div className="space-y-4">
        <h2 className="text-sm sm:text-base font-bold text-[var(--foreground)]">Configured Workflows</h2>

        {loading ? (
          <div className="p-8 text-center text-xs text-[var(--muted-foreground)] border border-[var(--border)] rounded-2xl">
            Loading workflows...
          </div>
        ) : workflows.length === 0 ? (
          <div className="border border-dashed border-[var(--border)] rounded-2xl p-12 text-center text-xs text-[var(--muted-foreground)]">
            <WorkflowIcon className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-2 opacity-50" />
            <p className="font-semibold text-[var(--foreground)]">No Workflows Configured</p>
            <p className="mt-1">Automate multi-step validation, approval, and generation workflows.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((wf) => (
              <div
                key={wf.id}
                className="border border-[var(--border)] rounded-2xl bg-[var(--card)] p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm tracking-tight">{wf.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-[var(--surface)] text-[var(--muted-foreground)] border border-[var(--border)]">
                      {wf.triggerType}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--muted-foreground)] mb-4 line-clamp-2">
                    {wf.description || 'Automated document processing pipeline.'}
                  </p>

                  <div className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-1.5 font-mono mb-4">
                    <FileCheck className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Version {wf.version}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
                  </span>

                  <Button
                    size="sm"
                    onClick={() => handleTrigger(wf)}
                    disabled={triggering}
                    className="text-xs h-7 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold"
                  >
                    <Play className="w-3 h-3 mr-1" /> Run Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review & Decide Modal */}
      {selectedApproval && (
        <Modal
          isOpen={!!selectedApproval}
          onClose={() => setSelectedApproval(null)}
          title="Review Workflow Approval Step"
        >
          <div className="space-y-4 py-2 text-xs">
            <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
              <div className="font-semibold text-sm">{selectedApproval.workflowName}</div>
              <div className="text-[11px] text-[var(--muted-foreground)]">Step: {selectedApproval.stepId}</div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Decision Notes (Optional)</label>
              <textarea
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="Reason or notes regarding this decision..."
                className="w-full h-20 p-2.5 rounded-lg border border-[var(--input)] bg-[var(--background)] text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <Button
                variant="outline"
                onClick={() => handleDecision('rejected')}
                disabled={deciding}
                className="text-xs text-red-400 border-red-900/40 hover:bg-red-950/20"
              >
                <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
              </Button>
              <Button
                onClick={() => handleDecision('approved')}
                disabled={deciding}
                className="text-xs bg-white text-black hover:bg-neutral-200 font-semibold"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve Step
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Workflow Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Document Workflow">
        <form onSubmit={handleCreateWorkflow} className="space-y-4 py-2 text-xs">
          <div>
            <label className="text-xs font-semibold block mb-1">Workflow Name *</label>
            <Input
              value={newWfName}
              onChange={(e) => setNewWfName(e.target.value)}
              placeholder="e.g. Invoice Finalization & Approval"
              required
              className="h-9 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Description</label>
            <Input
              value={newWfDesc}
              onChange={(e) => setNewWfDesc(e.target.value)}
              placeholder="Brief description of workflow purpose"
              className="h-9 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Trigger Type</label>
            <select
              value={newWfTrigger}
              onChange={(e) => setNewWfTrigger(e.target.value)}
              className="w-full h-9 rounded-md border border-[var(--input)] bg-[var(--background)] px-3 text-xs"
            >
              <option value="manual">Manual Trigger</option>
              <option value="document_created">Document Created</option>
              <option value="document_finalized">Document Finalized</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="reqApproval"
              checked={requireApprovalStep}
              onChange={(e) => setRequireApprovalStep(e.target.checked)}
              className="rounded border-[var(--input)] text-[var(--primary)]"
            />
            <label htmlFor="reqApproval" className="text-xs font-medium cursor-pointer">
              Include an Executive In-App Approval Step
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creatingWf}
              className="bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold"
            >
              {creatingWf ? 'Creating...' : 'Create Workflow'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

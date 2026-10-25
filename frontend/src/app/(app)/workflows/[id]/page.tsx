'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Play,
  Clock,
  Layers,
  Edit,
  CheckCircle2,
  XCircle,
  Activity,
  FileCheck,
  Calendar,
  AlertCircle,
  ChevronRight,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { TablePagination } from '@/components/ui/table-pagination';
import { api } from '@/lib/api';
import { Workflow, WorkflowExecution } from '@/types';
import { WorkflowDryRunModal } from '@/components/workflow/workflow-dryrun-modal';
import { WorkflowScheduleModal } from '@/components/workflow/workflow-schedule-modal';
import { WorkflowBulkModal } from '@/components/workflow/workflow-bulk-modal';
import { WorkflowVersionModal } from '@/components/workflow/workflow-version-modal';
import { useConfirm } from '@/components/ui/confirm-dialog';

export default function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const confirm = useConfirm();

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [execPage, setExecPage] = useState(1);
  const execPageSize = 8;

  // Modals state
  const [isDryRunOpen, setIsDryRunOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);

  const [triggering, setTriggering] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [wf, execs] = await Promise.all([
        api.getWorkflow(id),
        api.getWorkflowExecutions(id, { limit: 20 }),
      ]);
      setWorkflow(wf);
      if (Array.isArray(execs)) setExecutions(execs);
    } catch (err: any) {
      setError(err.message || 'Failed to load workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!workflow) return;
    try {
      const updated = await api.toggleWorkflow(workflow.id);
      setWorkflow((prev) => (prev ? { ...prev, isActive: updated.isActive } : null));
      setFeedbackMsg(`Workflow is now ${updated.isActive ? 'Active' : 'Draft'}.`);
    } catch (err: any) {
      setFeedbackMsg(`Failed to toggle status: ${err.message}`);
    }
  };

  const handleRunNow = async () => {
    if (!workflow) return;
    if (!workflow.isActive) {
      const ok = await confirm({
        title: 'Activate & Run Workflow?',
        message: `"${workflow.name}" is currently marked as Draft (Inactive). Would you like to activate it and execute the workflow?`,
        itemName: workflow.name,
        itemType: 'Workflow',
        confirmText: 'Activate & Run',
        variant: 'primary',
      });
      if (!ok) return;
    }

    setTriggering(true);
    setFeedbackMsg(null);
    try {
      const ex = await api.triggerWorkflow(workflow.id, { triggeredFrom: 'Workflow Detail' });
      setFeedbackMsg(`Execution started! ID: ${ex.id}`);
      loadData();
    } catch (err: any) {
      setFeedbackMsg(`Error: ${err.message}`);
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[var(--muted-foreground)]">
        Loading workflow...
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/50 text-red-400 text-xs">
          {error || 'Workflow not found'}
        </div>
        <Link href="/workflows">
          <Button variant="outline" className="text-xs">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Workflows
          </Button>
        </Link>
      </div>
    );
  }

  const def =
    typeof workflow.definition === 'string'
      ? JSON.parse(workflow.definition)
      : workflow.definition;

  const paginatedExecutions = executions.slice(
    (execPage - 1) * execPageSize,
    execPage * execPageSize
  );
  const totalExecPages = Math.ceil(executions.length / execPageSize);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title={workflow.name}
        description={workflow.description || 'Automated document processing pipeline'}
        backHref="/workflows"
        action={{
          label: triggering ? 'Running...' : 'Run Workflow',
          onClick: handleRunNow,
          icon: Play,
        }}
      >
        <button
          type="button"
          onClick={handleToggleActive}
          title={`Click to set as ${workflow.isActive ? 'Draft (Inactive)' : 'Active'}`}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all hover:scale-105 cursor-pointer mr-1 ${
            workflow.isActive
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
              : 'border-neutral-500/30 bg-neutral-500/10 text-neutral-400 hover:bg-neutral-500/20'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              workflow.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'
            }`}
          />
          {workflow.isActive ? 'Active' : 'Draft'}
        </button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDryRunOpen(true)}
          className="text-xs h-8 font-semibold"
        >
          <Activity className="w-3.5 h-3.5 sm:mr-1" />
          <span className="hidden sm:inline">Test Run</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsScheduleOpen(true)}
          className="text-xs h-8 font-semibold"
        >
          <Clock className="w-3.5 h-3.5 sm:mr-1" />
          <span className="hidden sm:inline">Schedule</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsBulkOpen(true)}
          className="text-xs h-8 font-semibold"
        >
          <Layers className="w-3.5 h-3.5 sm:mr-1" />
          <span className="hidden sm:inline">Bulk CSV</span>
        </Button>
        <Link href={`/workflows/${workflow.id}/edit`}>
          <Button variant="outline" size="sm" className="text-xs h-8 font-semibold">
            <Edit className="w-3.5 h-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
        </Link>
      </Header>

      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full">
        {feedbackMsg && (
          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white">
            {feedbackMsg}
          </div>
        )}

      {/* Pipeline Visual Flow Preview */}
      <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            Configured Pipeline Steps ({def?.nodes?.length || 0})
          </h2>
          <button
            onClick={() => setIsVersionsOpen(true)}
            className="text-xs text-[var(--muted-foreground)] hover:text-white flex items-center gap-1 font-semibold"
          >
            <Calendar className="w-3 h-3" /> Revisions
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(def?.nodes || []).map((node: any, idx: number) => (
            <React.Fragment key={node.id}>
              <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center gap-2 text-xs">
                <span className="w-5 h-5 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-400 flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <span className="font-semibold">{node.label}</span>
                <span className="text-[9px] uppercase font-mono text-neutral-500">[{node.type}]</span>
              </div>
              {idx < (def?.nodes?.length || 0) - 1 && (
                <span className="text-neutral-600 text-sm">→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Execution History */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
          Execution History ({executions.length})
        </h2>

        {executions.length === 0 ? (
          <div className="border border-dashed border-[var(--border)] rounded-2xl p-12 text-center text-xs text-[var(--muted-foreground)]">
            No executions for this workflow yet. Click "Run Now" to trigger an execution.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="border border-[var(--border)] rounded-2xl bg-[var(--card)] divide-y divide-[var(--border)] overflow-hidden">
              {paginatedExecutions.map((ex) => (
                <Link
                  key={ex.id}
                  href={`/workflows/executions/${ex.id}`}
                  className="p-4 flex items-center justify-between hover:bg-[var(--surface)] transition-colors text-xs block"
                >
                  <div className="flex items-center gap-3">
                    {ex.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {ex.status === 'failed' && <XCircle className="w-4 h-4 text-red-400" />}
                    {ex.status === 'running' && <Activity className="w-4 h-4 text-blue-400 animate-pulse" />}
                    {ex.status === 'waiting_approval' && <Clock className="w-4 h-4 text-amber-400" />}

                    <div>
                      <div className="font-bold text-sm text-[var(--foreground)] font-mono">{ex.id}</div>
                      <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                        Trigger: {ex.triggerSource} • {new Date(ex.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono text-neutral-400 text-[11px]">{ex.durationMs}ms</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        ex.status === 'completed'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                          : ex.status === 'failed'
                          ? 'bg-red-950 text-red-400 border border-red-900'
                          : 'bg-amber-950 text-amber-400 border border-amber-900'
                      }`}
                    >
                      {ex.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-neutral-500" />
                  </div>
                </Link>
              ))}
            </div>

            {executions.length > execPageSize && (
              <TablePagination
                page={execPage}
                totalPages={totalExecPages}
                totalItems={executions.length}
                pageSize={execPageSize}
                onPageChange={setExecPage}
                itemName="executions"
              />
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {isDryRunOpen && (
        <WorkflowDryRunModal
          isOpen={isDryRunOpen}
          onClose={() => setIsDryRunOpen(false)}
          workflowId={workflow.id}
          definition={def}
        />
      )}

      {isScheduleOpen && (
        <WorkflowScheduleModal
          isOpen={isScheduleOpen}
          onClose={() => setIsScheduleOpen(false)}
          workflowId={workflow.id}
        />
      )}

      {isBulkOpen && (
        <WorkflowBulkModal
          isOpen={isBulkOpen}
          onClose={() => setIsBulkOpen(false)}
          workflowId={workflow.id}
        />
      )}

      {isVersionsOpen && (
        <WorkflowVersionModal
          isOpen={isVersionsOpen}
          onClose={() => setIsVersionsOpen(false)}
          workflowId={workflow.id}
          onRestored={loadData}
        />
      )}
      </div>
    </div>
  );
}

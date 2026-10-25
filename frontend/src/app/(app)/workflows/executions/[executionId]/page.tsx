'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  RotateCcw,
  FileText,
  Download,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Send,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { api } from '@/lib/api';
import { WorkflowExecution, WorkflowStepExecution } from '@/types';

export default function WorkflowExecutionDetailPage({
  params,
}: {
  params: Promise<{ executionId: string }>;
}) {
  const { executionId } = use(params);
  const router = useRouter();

  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadExecution();
  }, [executionId]);

  const loadExecution = async () => {
    setLoading(true);
    try {
      const res = await api.getWorkflowExecution(executionId);
      setExecution(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load execution details');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const retryEx = await api.retryWorkflowExecution(executionId);
      router.push(`/workflows/executions/${retryEx.id}`);
    } catch (err: any) {
      alert(`Retry failed: ${err.message}`);
    } finally {
      setRetrying(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.cancelWorkflowExecution(executionId);
      loadExecution();
    } catch (err: any) {
      alert(`Cancel failed: ${err.message}`);
    } finally {
      setCancelling(false);
    }
  };

  const toggleStepExpand = (stepId: string) => {
    setExpandedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[var(--muted-foreground)]">
        Loading execution trail...
      </div>
    );
  }

  if (error || !execution) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/50 text-red-400 text-xs">
          {error || 'Execution not found'}
        </div>
        <Link href="/workflows">
          <Button variant="outline" className="text-xs">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Workflows
          </Button>
        </Link>
      </div>
    );
  }

  // Parse logs
  let logsList: Array<{ timestamp: string; level: string; message: string }> = [];
  if (typeof execution.logs === 'string') {
    try {
      logsList = JSON.parse(execution.logs);
    } catch {}
  } else if (Array.isArray(execution.logs)) {
    logsList = execution.logs as any;
  }

  // Parse generated doc IDs
  let generatedDocs: string[] = [];
  if (typeof execution.generatedDocIds === 'string') {
    try {
      generatedDocs = JSON.parse(execution.generatedDocIds);
    } catch {}
  } else if (Array.isArray(execution.generatedDocIds)) {
    generatedDocs = execution.generatedDocIds as any;
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title={execution.workflowName || 'Workflow Execution'}
        description={`ID: ${execution.id} • Trigger: ${execution.triggerSource} • Pinned: v${execution.versionNumber || 1}`}
        backHref={execution.workflowId ? `/workflows/${execution.workflowId}` : '/workflows'}
      >
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
              execution.status === 'completed'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                : execution.status === 'failed'
                ? 'bg-red-950 text-red-400 border border-red-900'
                : 'bg-amber-950 text-amber-400 border border-amber-900'
            }`}
          >
            {execution.status}
          </span>
          {execution.status === 'failed' && (
            <Button
              onClick={handleRetry}
              disabled={retrying}
              size="sm"
              className="text-xs bg-white text-black hover:bg-neutral-200 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              {retrying ? 'Retrying...' : 'Retry'}
            </Button>
          )}

          {(execution.status === 'running' || execution.status === 'waiting_approval') && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={cancelling}
              className="text-xs text-red-400 border-red-900/40 hover:bg-red-950/20"
            >
              Cancel Execution
            </Button>
          )}
        </div>
      </Header>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="text-[11px] font-semibold text-[var(--muted-foreground)]">Duration</div>
          <div className="text-lg font-bold mt-1 text-[var(--foreground)] font-mono">
            {execution.durationMs}ms
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="text-[11px] font-semibold text-[var(--muted-foreground)]">Started At</div>
          <div className="text-xs font-mono font-semibold mt-1 text-[var(--foreground)] truncate">
            {new Date(execution.startedAt).toLocaleTimeString()}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="text-[11px] font-semibold text-[var(--muted-foreground)]">Steps Executed</div>
          <div className="text-lg font-bold mt-1 text-[var(--foreground)]">
            {execution.stepExecutions?.length || 0}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="text-[11px] font-semibold text-[var(--muted-foreground)]">Docs Produced</div>
          <div className="text-lg font-bold mt-1 text-[var(--foreground)]">
            {generatedDocs.length}
          </div>
        </div>
      </div>

      {/* Error Message Alert if Failed */}
      {execution.errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-900/50 text-red-400 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Execution Failed</span>
            <span className="mt-0.5">{execution.errorMessage}</span>
          </div>
        </div>
      )}

      {/* Generated Documents References */}
      {generatedDocs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            Generated Documents ({generatedDocs.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {generatedDocs.map((docId) => (
              <div
                key={docId}
                className="p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-neutral-400" />
                  <span className="font-mono text-xs">{docId}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <a
                    href={`/api/v1/documents/${docId}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface)] text-[var(--muted-foreground)] hover:text-white"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step-by-Step Execution Timeline */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
          Step-by-Step Execution Timeline
        </h2>

        {execution.stepExecutions && execution.stepExecutions.length > 0 ? (
          <div className="space-y-2">
            {execution.stepExecutions.map((step) => {
              const isExpanded = !!expandedSteps[step.id];
              return (
                <div
                  key={step.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-colors"
                >
                  <div
                    onClick={() => toggleStepExpand(step.id)}
                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[var(--surface)] transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3">
                      {step.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {step.status === 'failed' && <XCircle className="w-4 h-4 text-red-400" />}
                      {step.status === 'running' && <Activity className="w-4 h-4 text-blue-400 animate-pulse" />}
                      {step.status === 'skipped' && <Clock className="w-4 h-4 text-neutral-500" />}

                      <div>
                        <span className="font-bold text-xs text-[var(--foreground)]">
                          {step.nodeLabel || step.nodeType}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono ml-2 uppercase">
                          [{step.nodeType}]
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {(step.attempt && step.attempt > 1) && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          Att. {step.attempt}/{step.maxRetries || 3}
                        </span>
                      )}
                      <span className="font-mono text-[11px] text-[var(--muted-foreground)]">{step.durationMs}ms</span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          step.status === 'completed'
                            ? 'bg-emerald-950 text-emerald-400'
                            : 'bg-red-950 text-red-400'
                        }`}
                      >
                        {step.status}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-neutral-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-neutral-500" />
                      )}
                    </div>
                  </div>

                  {/* Expandable Step Details */}
                  {isExpanded && (
                    <div className="p-3.5 bg-[var(--surface)] border-t border-[var(--border)] space-y-2 text-[11px] font-mono">
                      {step.errorMessage && (
                        <div className="p-2 rounded bg-red-950/20 text-red-400 border border-red-900/40">
                          Error: {step.errorMessage}
                        </div>
                      )}
                      <div>
                        <span className="text-neutral-500 uppercase tracking-wider block mb-1">
                          Output Data
                        </span>
                        <pre className="p-2 rounded bg-neutral-950 border border-neutral-900 text-neutral-300 overflow-x-auto text-[10px]">
                          {typeof step.outputData === 'string'
                            ? step.outputData
                            : JSON.stringify(step.outputData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-[var(--muted-foreground)] border border-dashed border-[var(--border)] rounded-xl">
            No step details recorded for this execution.
          </div>
        )}
      </div>

      {/* Execution Logs Console */}
      {logsList.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            Execution Audit Logs
          </h2>
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-900 font-mono text-[11px] text-neutral-300 space-y-1 max-h-64 overflow-y-auto">
            {logsList.map((log, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-neutral-500 shrink-0">{log.timestamp.slice(11, 19)}</span>
                <span
                  className={`text-[9px] uppercase font-bold px-1.5 rounded shrink-0 ${
                    log.level === 'error'
                      ? 'bg-red-950 text-red-400'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {log.level}
                </span>
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);
}

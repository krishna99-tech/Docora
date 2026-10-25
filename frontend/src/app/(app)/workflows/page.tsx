'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Workflow as WorkflowIcon,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Search,
  Filter,
  SlidersHorizontal,
  FileCheck,
  Calendar,
  Layers,
  Copy,
  Trash2,
  Download,
  Upload,
  MoreVertical,
  ChevronRight,
  TrendingUp,
  Activity,
  FileText,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Header } from '@/components/layout/header';
import { TablePagination } from '@/components/ui/table-pagination';
import { api } from '@/lib/api';
import {
  Workflow,
  WorkflowApproval,
  WorkflowExecution,
  WorkflowAnalytics,
} from '@/types';
import { WorkflowDryRunModal } from '@/components/workflow/workflow-dryrun-modal';
import { WorkflowScheduleModal } from '@/components/workflow/workflow-schedule-modal';
import { WorkflowBulkModal } from '@/components/workflow/workflow-bulk-modal';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { WorkflowVersionModal } from '@/components/workflow/workflow-version-modal';

export default function WorkflowsDashboardPage() {
  const router = useRouter();
  const confirm = useConfirm();

  // Data state
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [approvals, setApprovals] = useState<WorkflowApproval[]>([]);
  const [recentExecutions, setRecentExecutions] = useState<WorkflowExecution[]>([]);
  const [analytics, setAnalytics] = useState<WorkflowAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [wfPage, setWfPage] = useState(1);
  const wfPageSize = 6;
  const [appPage, setAppPage] = useState(1);
  const appPageSize = 6;
  const [execPage, setExecPage] = useState(1);
  const execPageSize = 10;

  // Search & Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'workflows' | 'approvals' | 'executions' | 'analytics'>('workflows');

  // Modals state
  const [dryRunWf, setDryRunWf] = useState<Workflow | null>(null);
  const [scheduleWfId, setScheduleWfId] = useState<string | null>(null);
  const [bulkWfId, setBulkWfId] = useState<string | null>(null);
  const [versionWfId, setVersionWfId] = useState<string | null>(null);

  // Approval decision modal
  const [selectedApproval, setSelectedApproval] = useState<WorkflowApproval | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [deciding, setDeciding] = useState(false);

  // Quick Trigger state
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [search, categoryFilter, statusFilter]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [wfList, appList, execList, stats] = await Promise.all([
        api.getWorkflows({
          search: search || undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        }),
        api.getWorkflowApprovals('pending'),
        api.getWorkflowExecutions(undefined, { limit: 10 }),
        api.getWorkflowAnalytics().catch(() => null),
      ]);

      if (Array.isArray(wfList)) setWorkflows(wfList);
      if (Array.isArray(appList)) setApprovals(appList);
      if (Array.isArray(execList)) setRecentExecutions(execList);
      if (stats) setAnalytics(stats);
    } catch {}
    setLoading(false);
  };

  const handleToggleActive = async (wf: Workflow) => {
    try {
      const updated = await api.toggleWorkflow(wf.id);
      setWorkflows((prev) => prev.map((w) => (w.id === wf.id ? { ...w, isActive: updated.isActive } : w)));
      setFeedbackMsg({ text: `Workflow "${wf.name}" is now ${updated.isActive ? 'Active' : 'Draft'}.` });
    } catch (err: any) {
      setFeedbackMsg({ text: `Failed to toggle status: ${err.message}`, error: true });
    }
  };

  const handleQuickRun = async (wf: Workflow) => {
    if (!wf.isActive) {
      const ok = await confirm({
        title: 'Activate & Run Workflow?',
        message: `"${wf.name}" is currently marked as Draft (Inactive). Would you like to activate it and execute the workflow?`,
        itemName: wf.name,
        itemType: 'Workflow',
        confirmText: 'Activate & Run',
        variant: 'primary',
      });
      if (!ok) return;
    }

    setTriggeringId(wf.id);
    setFeedbackMsg(null);
    try {
      const ex = await api.triggerWorkflow(wf.id, { triggeredFrom: 'Dashboard' });
      setFeedbackMsg({ text: `Workflow initiated! Execution ID: ${ex.id}` });
      fetchDashboardData();
    } catch (err: any) {
      setFeedbackMsg({ text: `Execution failed: ${err.message}`, error: true });
    } finally {
      setTriggeringId(null);
    }
  };

  const handleDuplicate = async (wfId: string) => {
    try {
      await api.duplicateWorkflow(wfId);
      fetchDashboardData();
    } catch (err: any) {
      alert(`Duplicate failed: ${err.message}`);
    }
  };

  const handleDelete = async (wfId: string, name: string) => {
    const ok = await confirm({
      title: 'Delete Workflow',
      message: 'Are you sure you want to delete this workflow permanently? All version history and scheduled triggers will be removed.',
      itemName: name,
      itemType: 'Workflow Pipeline',
      confirmText: 'Delete Workflow',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.deleteWorkflow(wfId);
      fetchDashboardData();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleExport = async (wfId: string) => {
    try {
      const data = await api.exportWorkflow(wfId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workflow-${wfId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        await api.importWorkflow(json);
        fetchDashboardData();
        setFeedbackMsg({ text: 'Workflow imported successfully!' });
      } catch (err: any) {
        setFeedbackMsg({ text: `Import failed: ${err.message}`, error: true });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDecision = async (status: 'approved' | 'rejected') => {
    if (!selectedApproval) return;
    setDeciding(true);
    try {
      await api.decideWorkflowApproval(selectedApproval.id, status, decisionNotes);
      setSelectedApproval(null);
      setDecisionNotes('');
      fetchDashboardData();
    } catch (err: any) {
      alert(`Decision error: ${err.message}`);
    } finally {
      setDeciding(false);
    }
  };

  const filteredWorkflows = workflows.filter((w) => {
    if (categoryFilter !== 'all' && w.category !== categoryFilter) return false;
    if (statusFilter === 'active' && !w.isActive) return false;
    if (statusFilter === 'inactive' && w.isActive) return false;
    if (
      search &&
      !w.name.toLowerCase().includes(search.toLowerCase()) &&
      !w.description?.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const paginatedWorkflows = filteredWorkflows.slice(
    (wfPage - 1) * wfPageSize,
    wfPage * wfPageSize
  );
  const totalWfPages = Math.ceil(filteredWorkflows.length / wfPageSize);

  const paginatedApprovals = approvals.slice(
    (appPage - 1) * appPageSize,
    appPage * appPageSize
  );
  const totalAppPages = Math.ceil(approvals.length / appPageSize);

  const paginatedExecutions = recentExecutions.slice(
    (execPage - 1) * execPageSize,
    execPage * execPageSize
  );
  const totalExecPages = Math.ceil(recentExecutions.length / execPageSize);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Workflow Automation"
        description="Build multi-step document pipelines, automate bulk runs, and manage state machine executions"
        action={{
          label: 'New Workflow',
          href: '/workflows/new',
        }}
      >
        <label className="cursor-pointer">
          <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          <span className="inline-flex items-center justify-center px-2.5 h-8 rounded-md border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold hover:bg-[var(--surface-hover)] transition-colors text-[var(--foreground)]">
            <Upload className="w-3.5 h-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">Import JSON</span>
          </span>
        </label>
        <Link href="/workflows/templates">
          <Button variant="outline" size="sm" className="text-xs h-8 font-semibold">
            <Layers className="w-3.5 h-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">Templates (15)</span>
          </Button>
        </Link>
      </Header>

      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full">

      {/* Global Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
            feedbackMsg.error
              ? 'bg-red-950/20 border-red-900/50 text-red-400'
              : 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.error ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-xs opacity-60 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Real Statistics Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="text-[11px] font-semibold text-[var(--muted-foreground)]">Workflows</div>
          <div className="text-xl font-bold mt-1 text-[var(--foreground)]">
            {analytics?.totalWorkflows ?? workflows.length}
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">
            {analytics?.activeWorkflows ?? workflows.filter((w) => w.isActive).length} active
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="text-[11px] font-semibold text-[var(--muted-foreground)]">Executions</div>
          <div className="text-xl font-bold mt-1 text-[var(--foreground)]">
            {analytics?.totalExecutions ?? 0}
          </div>
          <div className="text-[10px] text-emerald-400 mt-0.5">
            {analytics?.successfulExecutions ?? 0} successful
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="text-[11px] font-semibold text-[var(--muted-foreground)]">Success Rate</div>
          <div className="text-xl font-bold mt-1 text-emerald-400">
            {analytics?.successRate ? `${analytics.successRate.toFixed(1)}%` : '100%'}
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">
            {analytics?.failedExecutions ?? 0} failures
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="text-[11px] font-semibold text-[var(--muted-foreground)]">Avg Duration</div>
          <div className="text-xl font-bold mt-1 text-[var(--foreground)] font-mono">
            {analytics?.avgDurationMs ? `${analytics.avgDurationMs}ms` : '42ms'}
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">step latency</div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="text-[11px] font-semibold text-[var(--muted-foreground)]">Docs Generated</div>
          <div className="text-xl font-bold mt-1 text-[var(--foreground)]">
            {analytics?.documentsGenerated ?? 0}
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">PDF outputs</div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="text-[11px] font-semibold text-[var(--muted-foreground)]">Approvals Due</div>
          <div className="text-xl font-bold mt-1 text-amber-400 font-mono">
            {approvals.length}
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">pending review</div>
        </div>
      </div>

      {/* Pending Approvals Notice Banner */}
      {approvals.length > 0 && (
        <div className="border border-amber-900/50 bg-amber-950/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-amber-200">
                Pending Document Review Approvals ({approvals.length})
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('approvals')}
              className="text-xs font-semibold text-amber-400 hover:underline"
            >
              View All Approvals →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {approvals.slice(0, 2).map((app) => (
              <div
                key={app.id}
                className="p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-semibold text-sm">{app.workflowName || 'Document Approval'}</div>
                  <div className="text-[11px] text-[var(--muted-foreground)] font-mono">Step: {app.stepId}</div>
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

      {/* Navigation Tabs */}
      <div className="flex border-b border-[var(--border)] gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('workflows')}
          className={`pb-3 transition-colors ${
            activeTab === 'workflows'
              ? 'text-[var(--foreground)] border-b-2 border-white'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          All Workflows ({workflows.length})
        </button>
        <button
          onClick={() => setActiveTab('approvals')}
          className={`pb-3 transition-colors ${
            activeTab === 'approvals'
              ? 'text-[var(--foreground)] border-b-2 border-white'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          Pending Approvals ({approvals.length})
        </button>
        <button
          onClick={() => setActiveTab('executions')}
          className={`pb-3 transition-colors ${
            activeTab === 'executions'
              ? 'text-[var(--foreground)] border-b-2 border-white'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          Execution Trail ({recentExecutions.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 transition-colors ${
            activeTab === 'analytics'
              ? 'text-[var(--foreground)] border-b-2 border-white'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          Analytics & Performance
        </button>
      </div>

      {/* TAB 1: WORKFLOWS LIST */}
      {activeTab === 'workflows' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search workflows by name..."
                className="pl-9 h-8 text-xs bg-[var(--background)]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-8 rounded-md border border-[var(--input)] bg-[var(--background)] px-2.5 text-xs text-[var(--foreground)]"
              >
                <option value="all">All Categories</option>
                <option value="Finance">Finance</option>
                <option value="Billing">Billing</option>
                <option value="Sales">Sales</option>
                <option value="Reporting">Reporting</option>
                <option value="Bulk Processing">Bulk Processing</option>
                <option value="General">General</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 rounded-md border border-[var(--input)] bg-[var(--background)] px-2.5 text-xs text-[var(--foreground)]"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Draft / Inactive</option>
              </select>
            </div>
          </div>

          {/* Workflows Grid */}
          {loading ? (
            <div className="p-12 text-center text-xs text-[var(--muted-foreground)] border border-[var(--border)] rounded-2xl">
              Loading workflows...
            </div>
          ) : workflows.length === 0 ? (
            <div className="border border-dashed border-[var(--border)] rounded-2xl p-12 text-center text-xs text-[var(--muted-foreground)]">
              <WorkflowIcon className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-[var(--foreground)]">No Workflows Found</p>
              <p className="mt-1">Create a workflow from scratch or pick from our ready-made templates.</p>
              <div className="flex justify-center gap-3 mt-4">
                <Link href="/workflows/templates">
                  <Button variant="outline" className="text-xs h-8">
                    Browse Templates
                  </Button>
                </Link>
                <Link href="/workflows/new">
                  <Button className="text-xs h-8 bg-white text-black hover:bg-neutral-200">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Create Workflow
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedWorkflows.map((wf) => (
                  <div
                    key={wf.id}
                    className="border border-[var(--border)] rounded-2xl bg-[var(--card)] p-5 shadow-sm flex flex-col justify-between hover:border-neutral-500 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm tracking-tight truncate pr-2">
                          {wf.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-[var(--surface)] text-[var(--muted-foreground)] border border-[var(--border)]">
                          {wf.triggerType}
                        </span>
                      </div>

                      <p className="text-xs text-[var(--muted-foreground)] mb-4 line-clamp-2">
                        {wf.description || 'Automated document processing pipeline.'}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-[var(--muted-foreground)] font-mono mb-4 pt-2 border-t border-[var(--border)]">
                        <div className="flex items-center gap-1.5">
                          <FileCheck className="w-3.5 h-3.5 text-neutral-400" />
                          <span>v{wf.version}</span>
                        </div>
                        <span>{wf.category || 'General'}</span>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(wf)}
                          title={`Click to set as ${wf.isActive ? 'Draft (Inactive)' : 'Active'}`}
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all hover:scale-105 cursor-pointer ${
                            wf.isActive
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                              : 'border-neutral-500/30 bg-neutral-500/10 text-neutral-400 hover:bg-neutral-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              wf.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'
                            }`}
                          />
                          {wf.isActive ? 'Active' : 'Draft'}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Test / Dry Run */}
                        <button
                          onClick={() => setDryRunWf(wf)}
                          title="Dry Run / Test"
                          className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:text-white transition-colors"
                        >
                          <Activity className="w-3.5 h-3.5 text-neutral-400 hover:text-white" />
                        </button>

                        {/* Bulk Run */}
                        <button
                          onClick={() => setBulkWfId(wf.id)}
                          title="Bulk CSV Processing"
                          className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:text-white transition-colors"
                        >
                          <Layers className="w-3.5 h-3.5 text-neutral-400 hover:text-white" />
                        </button>

                        {/* Schedule */}
                        <button
                          onClick={() => setScheduleWfId(wf.id)}
                          title="Configure Schedule"
                          className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:text-white transition-colors"
                        >
                          <Clock className="w-3.5 h-3.5 text-neutral-400 hover:text-white" />
                        </button>

                        {/* Version History */}
                        <button
                          onClick={() => setVersionWfId(wf.id)}
                          title="Version History"
                          className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:text-white transition-colors"
                        >
                          <Calendar className="w-3.5 h-3.5 text-neutral-400 hover:text-white" />
                        </button>

                        {/* Export JSON */}
                        <button
                          onClick={() => handleExport(wf.id)}
                          title="Export JSON"
                          className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:text-white transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-neutral-400 hover:text-white" />
                        </button>

                        {/* Edit Builder */}
                        <Link href={`/workflows/${wf.id}/edit`}>
                          <Button variant="outline" size="sm" className="text-xs h-7 px-2 font-semibold">
                            Edit
                          </Button>
                        </Link>

                        {/* Run Now Button */}
                        <Button
                          size="sm"
                          onClick={() => handleQuickRun(wf)}
                          disabled={triggeringId === wf.id}
                          className="text-xs h-7 px-2.5 bg-white text-black hover:bg-neutral-200 font-semibold"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          {triggeringId === wf.id ? 'Running...' : 'Run'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredWorkflows.length > wfPageSize && (
                <TablePagination
                  page={wfPage}
                  totalPages={totalWfPages}
                  totalItems={filteredWorkflows.length}
                  pageSize={wfPageSize}
                  onPageChange={setWfPage}
                  itemName="workflows"
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PENDING APPROVALS */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold">Document Executive Approvals</h2>
          {approvals.length === 0 ? (
            <div className="border border-dashed border-[var(--border)] rounded-2xl p-12 text-center text-xs text-[var(--muted-foreground)]">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400 opacity-80" />
              <p className="font-semibold text-[var(--foreground)]">All Documents Approved</p>
              <p className="mt-1">There are no pending approval requests at this time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedApprovals.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] flex flex-col justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[var(--foreground)]">
                          {app.workflowName || 'Workflow Review Step'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 font-bold uppercase">
                          Pending
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--muted-foreground)] mt-1 font-mono">
                        Step ID: {app.stepId}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                        Submitted: {new Date(app.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[var(--border)] flex justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedApproval(app);
                          setDecisionNotes('');
                        }}
                        className="bg-white text-black hover:bg-neutral-200 text-xs font-semibold h-8"
                      >
                        Inspect & Review Step
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {approvals.length > appPageSize && (
                <TablePagination
                  page={appPage}
                  totalPages={totalAppPages}
                  totalItems={approvals.length}
                  pageSize={appPageSize}
                  onPageChange={setAppPage}
                  itemName="approvals"
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EXECUTION TRAIL */}
      {activeTab === 'executions' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold">Recent Pipeline Execution Trail</h2>
          {recentExecutions.length === 0 ? (
            <div className="border border-dashed border-[var(--border)] rounded-2xl p-12 text-center text-xs text-[var(--muted-foreground)]">
              No executions logged yet. Run a workflow to view execution tracking.
            </div>
          ) : (
            <div className="space-y-4">
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
                        <div className="font-bold text-sm text-[var(--foreground)]">
                          {ex.workflowName || 'Workflow Execution'}
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono flex items-center gap-2 mt-0.5">
                          <span>Trigger: {ex.triggerSource}</span>
                          <span>•</span>
                          <span>{new Date(ex.createdAt).toLocaleString()}</span>
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

              {recentExecutions.length > execPageSize && (
                <TablePagination
                  page={execPage}
                  totalPages={totalExecPages}
                  totalItems={recentExecutions.length}
                  pageSize={execPageSize}
                  onPageChange={setExecPage}
                  itemName="executions"
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold">14-Day Performance & Throughput</h2>
          {analytics?.dailyVolume && analytics.dailyVolume.length > 0 ? (
            <div className="p-5 border border-[var(--border)] rounded-2xl bg-[var(--card)] space-y-4">
              <div className="text-xs text-[var(--muted-foreground)]">
                Daily execution volume over the past 14 days
              </div>
              <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5 text-center">
                {analytics.dailyVolume.map((d) => (
                  <div key={d.date} className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                    <div className="text-[9px] font-mono text-neutral-500 truncate">{d.date.slice(5)}</div>
                    <div className="text-sm font-bold text-[var(--foreground)] mt-1">{d.total}</div>
                    <div className="text-[9px] text-emerald-400 mt-0.5">{d.successful}✓</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[var(--muted-foreground)] border border-[var(--border)] rounded-2xl">
              No historical execution volume recorded in the last 14 days.
            </div>
          )}
        </div>
      )}

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

      {/* Dry Run Simulation Modal */}
      {dryRunWf && (
        <WorkflowDryRunModal
          isOpen={!!dryRunWf}
          onClose={() => setDryRunWf(null)}
          workflowId={dryRunWf.id}
          definition={
            typeof dryRunWf.definition === 'string'
              ? JSON.parse(dryRunWf.definition)
              : dryRunWf.definition
          }
        />
      )}

      {/* Scheduling Modal */}
      {scheduleWfId && (
        <WorkflowScheduleModal
          isOpen={!!scheduleWfId}
          onClose={() => setScheduleWfId(null)}
          workflowId={scheduleWfId}
        />
      )}

      {/* Bulk Processing Modal */}
      {bulkWfId && (
        <WorkflowBulkModal
          isOpen={!!bulkWfId}
          onClose={() => setBulkWfId(null)}
          workflowId={bulkWfId}
        />
      )}

      {/* Version History Modal */}
      {versionWfId && (
        <WorkflowVersionModal
          isOpen={!!versionWfId}
          onClose={() => setVersionWfId(null)}
          workflowId={versionWfId}
          onRestored={fetchDashboardData}
        />
      )}
    </div>
  </div>
  );
}

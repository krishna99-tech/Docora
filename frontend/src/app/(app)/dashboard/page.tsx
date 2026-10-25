'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Receipt,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Eye,
  Download,
  Plus,
  Workflow,
  Sparkles,
  Palette,
  CheckCircle2,
  XCircle,
  Activity,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PDFViewerModal } from '@/components/pdf/pdf-viewer-modal';
import { TablePagination } from '@/components/ui/table-pagination';
import { WorkflowExecution } from '@/types';

export default function DashboardPage() {
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [previewDocNumber, setPreviewDocNumber] = useState<string>('');
  const [previewIsDraft, setPreviewIsDraft] = useState<boolean>(false);
  const [recentPage, setRecentPage] = useState(1);
  const recentPerPage = 4;

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.getDashboardStats(),
  });

  const { data: recentDocs, isLoading: docsLoading, refetch: refetchDocs } = useQuery({
    queryKey: ['dashboard-recent'],
    queryFn: () => api.getRecentDocuments(8),
  });

  const { data: workflowAnalytics, isLoading: workflowLoading } = useQuery({
    queryKey: ['dashboard-workflow-analytics'],
    queryFn: () => api.getWorkflowAnalytics(),
  });

  const { data: recentExecutions = [], isLoading: execsLoading } = useQuery<WorkflowExecution[]>({
    queryKey: ['dashboard-recent-executions'],
    queryFn: () => api.getWorkflowExecutions(undefined, { limit: 5 }),
  });

  const { data: pdfJobs = [] } = useQuery({
    queryKey: ['dashboard-pdf-jobs'],
    queryFn: () => api.listPdfJobs(),
  });

  const handleOpenPreview = (id: string, num: string, status: string) => {
    setPreviewDocId(id);
    setPreviewDocNumber(num);
    setPreviewIsDraft(status === 'draft');
  };

  const totalDocs = stats?.totalDocuments ?? 0;
  const totalExecs = workflowAnalytics?.totalExecutions ?? 0;
  const successfulExecs = workflowAnalytics?.successfulExecutions ?? 0;
  const failedExecs = workflowAnalytics?.failedExecutions ?? 0;
  const successRate = totalExecs > 0 ? Math.round((successfulExecs / totalExecs) * 100) : 100;

  const statCards = [
    {
      label: 'Total Documents',
      value: totalDocs,
      icon: FileText,
      description: `+${stats?.documentsThisMonth ?? 0} in current period`,
      badge: 'All Artifacts',
    },
    {
      label: 'Verified Revenue',
      value: formatCurrency(stats?.totalReceiptRevenueMinor || 0),
      icon: TrendingUp,
      description: `Pending: ${formatCurrency(stats?.totalInvoicePendingMinor || 0)}`,
      badge: 'Settled',
    },
    {
      label: 'Workflow Executions',
      value: totalExecs,
      icon: Workflow,
      description: `${successfulExecs} passed / ${failedExecs} failed (${successRate}%)`,
      badge: 'Automations',
    },
    {
      label: 'Active Pipelines',
      value: workflowAnalytics?.activeWorkflows ?? 0,
      icon: Activity,
      description: 'Scheduled daemon triggers active',
      badge: 'Cron Ready',
    },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Dashboard"
        description="Comprehensive real-time overview of document throughput, automated pipelines, and financial records"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">
        {/* Quick Actions Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]">
          <div>
            <h2 className="text-sm font-bold text-[var(--foreground)]">Quick Actions Hub</h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Create documents, configure templates, or dispatch batch automations
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/receipts/new">
              <Button size="sm" variant="default" className="text-xs font-semibold">
                <Plus className="w-3.5 h-3.5 mr-1" />
                New Receipt
              </Button>
            </Link>
            <Link href="/invoices/new">
              <Button size="sm" variant="secondary" className="text-xs font-semibold">
                <Plus className="w-3.5 h-3.5 mr-1" />
                New Invoice
              </Button>
            </Link>
            <Link href="/studio">
              <Button size="sm" variant="outline" className="text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Document Studio
              </Button>
            </Link>
            <Link href="/workflows/new">
              <Button size="sm" variant="outline" className="text-xs font-semibold">
                <Workflow className="w-3.5 h-3.5 mr-1" />
                New Workflow
              </Button>
            </Link>
            <Link href="/templates">
              <Button size="sm" variant="outline" className="text-xs font-semibold">
                <Palette className="w-3.5 h-3.5 mr-1" />
                Templates
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Card key={idx} className="p-4 sm:p-5 border-[var(--border)] space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    {card.label}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--foreground)]">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="text-2xl font-black text-[var(--foreground)] tracking-tight">
                  {statsLoading || workflowLoading ? '...' : card.value}
                </div>

                <div className="text-[11px] text-[var(--muted-foreground)] truncate">
                  {card.description}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Split Section: Recent Documents & Recent Workflow Runs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Recent Documents (Span 2) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)]">Recent Documents</h3>
                <p className="text-xs text-[var(--muted-foreground)]">Latest generated artifacts and status</p>
              </div>
              <Link href="/documents">
                <Button variant="ghost" size="sm" className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  View All Documents <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>

            {/* Desktop Table View */}
            <Card className="hidden sm:block border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--surface-secondary)] border-b border-[var(--border)] text-[var(--muted-foreground)]">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Document</th>
                      <th className="py-3 px-4 font-semibold">Recipient</th>
                      <th className="py-3 px-4 font-semibold">Issue Date</th>
                      <th className="py-3 px-4 font-semibold text-right">Total</th>
                      <th className="py-3 px-4 font-semibold text-center">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {docsLoading ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs text-[var(--muted-foreground)]">
                          Loading documents...
                        </td>
                      </tr>
                    ) : !recentDocs || recentDocs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs text-[var(--muted-foreground)]">
                          No documents created yet. Issue your first receipt or invoice.
                        </td>
                      </tr>
                    ) : (
                      recentDocs
                        .slice((recentPage - 1) * recentPerPage, recentPage * recentPerPage)
                        .map((doc) => (
                          <tr key={doc.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-mono font-bold text-[var(--foreground)]">{doc.documentNumber}</div>
                              <div className="text-[10px] text-[var(--muted-foreground)] capitalize">{doc.documentType}</div>
                            </td>
                            <td className="py-3 px-4 text-[var(--foreground)] font-medium">
                              {doc.customer?.name || 'Walk-in Customer'}
                            </td>
                            <td className="py-3 px-4 text-[var(--muted-foreground)]">{formatDate(doc.issueDate)}</td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-[var(--foreground)]">
                              {formatCurrency(doc.totalMinor, doc.currency)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge status={doc.status} />
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenPreview(doc.id, doc.documentNumber, doc.status)}
                                  title="Live Preview"
                                  className="h-7 w-7"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => api.downloadDocument(doc.id, `${doc.documentNumber}.pdf`)}
                                  title="Download PDF"
                                  className="h-7 w-7"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>

              {recentDocs && recentDocs.length > recentPerPage && (
                <TablePagination
                  page={recentPage}
                  totalPages={Math.ceil(recentDocs.length / recentPerPage)}
                  totalItems={recentDocs.length}
                  pageSize={recentPerPage}
                  onPageChange={setRecentPage}
                  itemName="documents"
                />
              )}
            </Card>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-2.5">
              {docsLoading ? (
                <Card className="p-6 text-center text-xs text-[var(--muted-foreground)]">Loading documents...</Card>
              ) : !recentDocs || recentDocs.length === 0 ? (
                <Card className="p-8 text-center text-xs text-[var(--muted-foreground)]">No documents yet.</Card>
              ) : (
                recentDocs
                  .slice((recentPage - 1) * recentPerPage, recentPage * recentPerPage)
                  .map((doc) => (
                    <Card key={doc.id} className="p-3.5 space-y-2 border border-[var(--border)]">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs">{doc.documentNumber}</span>
                        <Badge status={doc.status} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                        <span className="capitalize">{doc.documentType} &bull; {doc.customer?.name || 'Walk-in'}</span>
                        <span>{formatDate(doc.issueDate)}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]">
                        <span className="font-bold text-xs">{formatCurrency(doc.totalMinor, doc.currency)}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleOpenPreview(doc.id, doc.documentNumber, doc.status)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Preview
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => api.downloadDocument(doc.id, `${doc.documentNumber}.pdf`)}
                          >
                            <Download className="w-3.5 h-3.5 mr-1" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
              )}
            </div>
          </div>

          {/* Right Column: Recent Workflow Activity (Span 1) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)]">Automation Activity</h3>
                <p className="text-xs text-[var(--muted-foreground)]">Recent pipeline runs & status</p>
              </div>
              <Link href="/workflows">
                <Button variant="ghost" size="sm" className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  All <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>

            <Card className="p-4 border-[var(--border)] bg-[var(--surface)] space-y-3">
              {execsLoading ? (
                <div className="text-center py-8 text-xs text-[var(--muted-foreground)]">
                  Loading workflow runs...
                </div>
              ) : recentExecutions.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Workflow className="w-6 h-6 text-[var(--muted-foreground)] mx-auto" />
                  <p className="text-xs text-[var(--muted-foreground)]">No executions recorded yet.</p>
                  <Link href="/workflows/new">
                    <Button variant="outline" size="sm" className="text-xs">
                      Build First Pipeline
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentExecutions.slice(0, 5).map((exec: WorkflowExecution) => {
                    const isSuccess = exec.status === 'completed';
                    const isFailed = exec.status === 'failed';
                    return (
                      <div
                        key={exec.id}
                        className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/50 hover:bg-[var(--surface-secondary)] transition-colors flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          {isSuccess ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : isFailed ? (
                            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                          ) : (
                            <Activity className="w-4 h-4 text-blue-500 shrink-0 animate-pulse" />
                          )}
                          <div>
                            <div className="font-semibold text-[var(--foreground)] truncate max-w-[130px]">
                              {exec.workflowName || 'Automation Run'}
                            </div>
                            <div className="text-[10px] text-[var(--muted-foreground)]">
                              {exec.durationMs}ms &bull; {formatDate(exec.createdAt)}
                            </div>
                          </div>
                        </div>

                        <Badge
                          variant={isSuccess ? 'default' : isFailed ? 'danger' : 'outline'}
                          className="text-[10px] capitalize font-mono"
                        >
                          {exec.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      <PDFViewerModal
        isOpen={Boolean(previewDocId)}
        onClose={() => setPreviewDocId(null)}
        documentId={previewDocId}
        documentNumber={previewDocNumber}
        isDraft={previewIsDraft}
        onFinalized={() => {
          refetchStats();
          refetchDocs();
        }}
      />
    </div>
  );
}

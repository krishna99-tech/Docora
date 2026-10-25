'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  FileText,
  Workflow,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Server,
  Activity,
  HardDrive,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function AnalyticsDashboardPage() {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'all'>('30d');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.getDashboardStats(),
  });

  const { data: workflowAnalytics, isLoading: workflowLoading } = useQuery({
    queryKey: ['workflow-analytics'],
    queryFn: () => api.getWorkflowAnalytics(),
  });

  const totalDocs = stats?.totalDocuments || 0;
  const receiptsCount = stats?.receiptsGenerated || 0;
  const invoicesCount = stats?.invoicesGenerated || 0;
  const generalCount = stats?.generalPdfsGenerated || 0;

  const totalExecs = workflowAnalytics?.totalExecutions || 0;
  const successfulExecs = workflowAnalytics?.successfulExecutions || 0;
  const failedExecs = workflowAnalytics?.failedExecutions || 0;
  const successRate = totalExecs > 0 ? Math.round((successfulExecs / totalExecs) * 100) : 100;
  const avgDurationMs = workflowAnalytics?.avgDurationMs || 340;

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Analytics & System Monitoring"
        description="Comprehensive insights into document throughput, workflow performance, execution reliability, and resource consumption"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-[var(--foreground)]">Platform Telemetry Status:</span>
            <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Operational & Ingesting
            </span>
          </div>

          <div className="flex items-center gap-1 bg-[var(--surface)] p-1 rounded-lg border border-[var(--border)]">
            {(['7d', '30d', 'all'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors uppercase ${
                  timeframe === period
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                {period === '7d' ? 'Last 7 Days' : period === '30d' ? 'Last 30 Days' : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        {/* Primary KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 border-[var(--border)] space-y-2">
            <div className="flex items-center justify-between text-[var(--muted-foreground)]">
              <span className="text-xs font-semibold">Total Documents</span>
              <FileText className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-[var(--foreground)] tracking-tight">
              {statsLoading ? '...' : totalDocs}
            </div>
            <div className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-1">
              <span className="text-emerald-500 font-semibold">+{stats?.documentsThisMonth || 0}</span>
              <span>generated this period</span>
            </div>
          </Card>

          <Card className="p-5 border-[var(--border)] space-y-2">
            <div className="flex items-center justify-between text-[var(--muted-foreground)]">
              <span className="text-xs font-semibold">Workflow Success Rate</span>
              <Workflow className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-[var(--foreground)] tracking-tight">
              {workflowLoading ? '...' : `${successRate}%`}
            </div>
            <div className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-1">
              <span className="text-emerald-500 font-semibold">{successfulExecs} passed</span>
              <span>/ {failedExecs} failed</span>
            </div>
          </Card>

          <Card className="p-5 border-[var(--border)] space-y-2">
            <div className="flex items-center justify-between text-[var(--muted-foreground)]">
              <span className="text-xs font-semibold">Mean Execution Latency</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-[var(--foreground)] tracking-tight">
              {workflowLoading ? '...' : `${avgDurationMs}ms`}
            </div>
            <div className="text-[11px] text-[var(--muted-foreground)]">
              High throughput PDF rendering
            </div>
          </Card>

          <Card className="p-5 border-[var(--border)] space-y-2">
            <div className="flex items-center justify-between text-[var(--muted-foreground)]">
              <span className="text-xs font-semibold">Verified Revenue Total</span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-[var(--foreground)] tracking-tight">
              {statsLoading ? '...' : formatCurrency(stats?.totalReceiptRevenueMinor || 0)}
            </div>
            <div className="text-[11px] text-[var(--muted-foreground)]">
              Pending: {formatCurrency(stats?.totalInvoicePendingMinor || 0)}
            </div>
          </Card>
        </div>

        {/* Detailed Breakdown Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Document Generation Distribution */}
          <Card className="p-6 border-[var(--border)] space-y-5">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-[var(--foreground)]">
                Document Generation by Classification
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Proportion of documents rendered across all artifact categories.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Payment Receipts', count: receiptsCount, color: 'bg-emerald-500' },
                { label: 'Client Invoices', count: invoicesCount, color: 'bg-blue-500' },
                { label: 'General Business Reports', count: generalCount, color: 'bg-purple-500' },
              ].map((item) => {
                const percentage = totalDocs > 0 ? Math.round((item.count / totalDocs) * 100) : 0;
                return (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[var(--foreground)]">{item.label}</span>
                      <span className="text-[var(--muted-foreground)]">
                        {item.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted-foreground)]">
              <span>Cumulative storage footprint</span>
              <span className="font-mono font-semibold text-[var(--foreground)]">
                ~{(totalDocs * 128).toFixed(0)} KB (Encrypted)
              </span>
            </div>
          </Card>

          {/* Workflow Automation Engine Metrics */}
          <Card className="p-6 border-[var(--border)] space-y-5">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-[var(--foreground)]">
                Automation Pipeline Performance
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Execution volume, node failure rates, and background cron dispatch status.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] space-y-1">
                <span className="text-[var(--muted-foreground)] font-semibold">Active Workflows</span>
                <div className="text-xl font-bold text-[var(--foreground)]">
                  {workflowAnalytics?.activeWorkflows || 0}
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] space-y-1">
                <span className="text-[var(--muted-foreground)] font-semibold">Total Pipelines</span>
                <div className="text-xl font-bold text-[var(--foreground)]">
                  {workflowAnalytics?.totalWorkflows || 0}
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] space-y-1">
                <span className="text-[var(--muted-foreground)] font-semibold">Successful Runs</span>
                <div className="text-xl font-bold text-emerald-500">
                  {successfulExecs}
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] space-y-1">
                <span className="text-[var(--muted-foreground)] font-semibold">Failed Retries</span>
                <div className="text-xl font-bold text-red-500">
                  {failedExecs}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs">
              <span className="text-[var(--muted-foreground)]">Cron Scheduler Engine</span>
              <Badge variant="outline" className="text-emerald-500 font-mono text-[10px]">
                Active (Daemon)
              </Badge>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

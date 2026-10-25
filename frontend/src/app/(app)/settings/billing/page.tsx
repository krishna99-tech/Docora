'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  Check,
  Zap,
  HardDrive,
  FileText,
  Users,
  Workflow,
  ShieldCheck,
  Clock,
  ArrowRight,
  Sparkles,
  Download,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { PlanDefinition, PlanTier, WorkspaceBillingStatus, WorkspaceInvoice } from '@/types';
import { formatDate } from '@/lib/utils';

export default function BillingSettingsPage() {
  const queryClient = useQueryClient();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Queries
  const { data: billingStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['billing-status'],
    queryFn: () => api.getBillingStatus(),
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['billing-plans'],
    queryFn: () => api.getBillingPlans(),
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['billing-invoices'],
    queryFn: () => api.getBillingInvoices(),
  });

  // Mutation
  const changePlanMutation = useMutation({
    mutationFn: (data: { plan: string; billingCycle: string }) =>
      api.changePlan(data.plan, data.billingCycle),
    onSuccess: (updated) => {
      setFeedback({ type: 'success', text: `Successfully updated subscription to ${updated.plan.toUpperCase()} plan.` });
      queryClient.invalidateQueries({ queryKey: ['billing-status'] });
      queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', text: err.message || 'Failed to update plan.' });
    },
  });

  const currentPlan = billingStatus?.plan || 'free';

  // Calculate percentages
  const docPercent =
    billingStatus?.quotaDocumentsMonthly && billingStatus.quotaDocumentsMonthly > 0
      ? Math.min(100, Math.round((billingStatus.documentsUsedThisMonth / billingStatus.quotaDocumentsMonthly) * 100))
      : 0;

  const storagePercent =
    billingStatus?.quotaStorageMb && billingStatus.quotaStorageMb > 0
      ? Math.min(100, Math.round((billingStatus.storageUsedMb / billingStatus.quotaStorageMb) * 100))
      : 0;

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Plans, Billing & Quotas"
        description="Manage your workspace subscription tier, resource consumption allowances, and billing history"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {feedback && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
              feedback.type === 'success'
                ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400'
                : 'bg-red-950/20 border-red-900/40 text-red-400'
            }`}
          >
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
              ✕
            </button>
          </div>
        )}

        {/* Current Plan & Quota Utilization Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Plan Summary Card */}
          <Card className="p-6 border-[var(--border)] bg-[var(--surface-secondary)] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                Active Subscription
              </span>
              <Badge variant="outline" className="uppercase font-mono text-[10px] tracking-wider text-emerald-400 border-emerald-800/40 bg-emerald-950/30">
                {billingStatus?.subscriptionStatus || 'Active'}
              </Badge>
            </div>

            <div>
              <h2 className="text-3xl font-black text-[var(--foreground)] capitalize tracking-tight">
                {statusLoading ? '...' : currentPlan} Plan
              </h2>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Billed {billingStatus?.billingCycle || 'monthly'}. Renews on{' '}
                {billingStatus?.currentPeriodEnd ? formatDate(billingStatus.currentPeriodEnd) : 'next cycle'}.
              </p>
            </div>

            <div className="pt-2 border-t border-[var(--border)] text-xs space-y-2">
              <div className="flex justify-between text-[var(--muted-foreground)]">
                <span>Billing Period:</span>
                <span className="font-semibold text-[var(--foreground)] capitalize">
                  {billingStatus?.billingCycle || 'Monthly'}
                </span>
              </div>
              <div className="flex justify-between text-[var(--muted-foreground)]">
                <span>Generation Access:</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Unlocked
                </span>
              </div>
            </div>
          </Card>

          {/* Quota Progress Meter Card */}
          <Card className="lg:col-span-2 p-6 border-[var(--border)] space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)]">Resource Quotas & Utilization</h3>
                <p className="text-xs text-[var(--muted-foreground)]">Monthly usage across this workspace</p>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                Month to Date
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Document Quota */}
              <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-[var(--foreground)]">
                    <FileText className="w-3.5 h-3.5 text-neutral-400" /> Documents
                  </span>
                  <span className="font-mono text-neutral-400">
                    {billingStatus?.documentsUsedThisMonth || 0} /{' '}
                    {billingStatus?.quotaDocumentsMonthly === -1 ? 'Unlimited' : billingStatus?.quotaDocumentsMonthly || 50}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      docPercent > 90 ? 'bg-red-500' : docPercent > 70 ? 'bg-amber-400' : 'bg-white'
                    }`}
                    style={{ width: `${billingStatus?.quotaDocumentsMonthly === -1 ? 10 : docPercent}%` }}
                  />
                </div>
                <span className="text-[10px] text-neutral-500 block">
                  {billingStatus?.quotaDocumentsMonthly === -1 ? 'Unlimited enterprise tier' : `${docPercent}% of monthly allowance`}
                </span>
              </div>

              {/* Storage Quota */}
              <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-[var(--foreground)]">
                    <HardDrive className="w-3.5 h-3.5 text-neutral-400" /> Storage
                  </span>
                  <span className="font-mono text-neutral-400">
                    {billingStatus?.storageUsedMb?.toFixed(1) || 0} MB /{' '}
                    {billingStatus?.quotaStorageMb === -1 ? 'Unlimited' : `${billingStatus?.quotaStorageMb || 100} MB`}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-500"
                    style={{ width: `${storagePercent}%` }}
                  />
                </div>
                <span className="text-[10px] text-neutral-500 block">
                  {storagePercent}% of allocated cloud storage
                </span>
              </div>

              {/* Members Quota */}
              <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-[var(--foreground)]">
                    <Users className="w-3.5 h-3.5 text-neutral-400" /> Team Seats
                  </span>
                  <span className="font-mono text-neutral-400">
                    {billingStatus?.membersCount || 1} /{' '}
                    {billingStatus?.quotaMembers === -1 ? 'Unlimited' : billingStatus?.quotaMembers || 2}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500 block">
                  Active collaborators with role-based access
                </span>
              </div>

              {/* Workflows Quota */}
              <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-[var(--foreground)]">
                    <Workflow className="w-3.5 h-3.5 text-neutral-400" /> Workflows
                  </span>
                  <span className="font-mono text-neutral-400">
                    {billingStatus?.workflowsCount || 0} /{' '}
                    {billingStatus?.quotaWorkflows === -1 ? 'Unlimited' : billingStatus?.quotaWorkflows || 3}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500 block">
                  Automated generation pipelines
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Tier Selector Section */}
        <div className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-[var(--foreground)]">Select a Plan</h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Scale your document throughput as your organization expands
              </p>
            </div>

            {/* Monthly / Annual Toggle */}
            <div className="flex items-center gap-2 bg-[var(--surface-secondary)] p-1 rounded-xl border border-[var(--border)] self-start">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-neutral-800 text-white shadow-xs'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  billingCycle === 'annual'
                    ? 'bg-neutral-800 text-white shadow-xs'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                Annual <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">Save 20%</span>
              </button>
            </div>
          </div>

          {/* Plan Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const isCurrent = currentPlan.toLowerCase() === plan.id.toLowerCase();
              const price = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;

              return (
                <Card
                  key={plan.id}
                  className={`p-6 flex flex-col justify-between border transition-all ${
                    isCurrent
                      ? 'border-neutral-400 bg-neutral-900/40 ring-1 ring-neutral-400'
                      : 'border-[var(--border)] hover:border-neutral-600 bg-[var(--card)]'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-[var(--foreground)]">{plan.name}</h4>
                      {isCurrent && (
                        <Badge variant="outline" className="text-[10px] font-mono border-neutral-400 text-neutral-200">
                          Current
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black tracking-tight text-[var(--foreground)]">
                          ${price}
                        </span>
                        <span className="text-xs text-[var(--muted-foreground)]">
                          /{billingCycle === 'annual' ? 'year' : 'month'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                        {plan.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[var(--border)] space-y-2">
                      {plan.features.map((feat, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <Check className="w-3.5 h-3.5 text-neutral-300 mt-0.5 shrink-0" />
                          <span className="text-neutral-300 text-[11px]">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6">
                    {isCurrent ? (
                      <Button disabled variant="outline" className="w-full text-xs opacity-60">
                        Current Active Tier
                      </Button>
                    ) : (
                      <Button
                        onClick={() =>
                          changePlanMutation.mutate({ plan: plan.id, billingCycle })
                        }
                        disabled={changePlanMutation.isPending}
                        className="w-full text-xs font-semibold"
                      >
                        {changePlanMutation.isPending ? 'Updating...' : `Select ${plan.name}`}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Invoices & Receipts Table */}
        <div className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[var(--foreground)]">Invoice & Payment History</h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Audit records for all automated subscription charges
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface-secondary)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--surface)] text-[var(--muted-foreground)] uppercase text-[10px] tracking-wider border-b border-[var(--border)]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Invoice Number</th>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Amount</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-neutral-500">
                        No previous payment invoices found for this workspace.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-[var(--surface)] transition-colors">
                        <td className="py-3 px-4 font-mono font-medium">{inv.invoiceNumber}</td>
                        <td className="py-3 px-4 text-neutral-400">{formatDate(inv.paidAt)}</td>
                        <td className="py-3 px-4 font-mono font-bold text-[var(--foreground)]">
                          ${(inv.amount / 100).toFixed(2)} {inv.currency}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white"
                          >
                            <Download className="w-3 h-3" /> PDF
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
} from 'lucide-react';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PDFViewerModal } from '@/components/pdf/pdf-viewer-modal';

export default function DashboardPage() {
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [previewDocNumber, setPreviewDocNumber] = useState<string>('');
  const [previewIsDraft, setPreviewIsDraft] = useState<boolean>(false);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.getDashboardStats(),
  });

  const { data: recentDocs, isLoading: docsLoading, refetch: refetchDocs } = useQuery({
    queryKey: ['dashboard-recent'],
    queryFn: () => api.getRecentDocuments(8),
  });

  const handleOpenPreview = (id: string, num: string, status: string) => {
    setPreviewDocId(id);
    setPreviewDocNumber(num);
    setPreviewIsDraft(status === 'draft');
  };

  const statCards = [
    {
      label: 'Total Documents',
      value: stats?.totalDocuments ?? 0,
      icon: FileText,
      description: 'All generated artifacts',
    },
    {
      label: 'Receipts Issued',
      value: stats?.receiptsGenerated ?? 0,
      icon: Receipt,
      description: `Revenue: ${formatCurrency(stats?.totalReceiptRevenueMinor || 0)}`,
    },
    {
      label: 'Invoices Created',
      value: stats?.invoicesGenerated ?? 0,
      icon: FileSpreadsheet,
      description: `Pending: ${formatCurrency(stats?.totalInvoicePendingMinor || 0)}`,
    },
    {
      label: 'This Month',
      value: stats?.documentsThisMonth ?? 0,
      icon: TrendingUp,
      description: 'Activity in current period',
    },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Dashboard"
        description="Overview of your business documents, revenue, and recent activities"
      />

      <div className="p-8 space-y-8 max-w-7xl">
        {/* Quick Actions Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]">
          <div>
            <h2 className="text-sm font-bold text-[var(--foreground)]">Quick Actions</h2>
            <p className="text-xs text-[var(--muted-foreground)]">Generate documents in seconds</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/receipts/new">
              <Button size="sm" variant="default">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Create Receipt
              </Button>
            </Link>
            <Link href="/invoices/new">
              <Button size="sm" variant="secondary">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Create Invoice
              </Button>
            </Link>
            <Link href="/pdf-generator">
              <Button size="sm" variant="outline">
                <FileText className="w-3.5 h-3.5 mr-1" />
                Generate PDF
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Card key={idx} className="relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    {card.label}
                  </span>
                  <div className="w-8 h-8 rounded-md bg-[var(--surface-secondary)] flex items-center justify-center text-[var(--foreground)]">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-[var(--foreground)] tracking-tight">
                    {statsLoading ? '—' : card.value}
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)] mt-1 flex items-center gap-1">
                    {card.description}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Recent Documents Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--foreground)] tracking-tight">Recent Documents</h2>
              <p className="text-xs text-[var(--muted-foreground)]">Latest finalized and draft records</p>
            </div>
            <Link href="/documents">
              <Button variant="ghost" size="sm" className="text-xs">
                View All Documents
                <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--surface-secondary)] border-b border-[var(--border)] text-[var(--muted-foreground)] uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Document #</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-[var(--foreground)]">
                  {docsLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[var(--muted-foreground)]">
                        Loading documents...
                      </td>
                    </tr>
                  ) : !recentDocs || recentDocs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <Clock className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-2" />
                        <p className="font-semibold text-sm">No documents yet</p>
                        <p className="text-xs text-[var(--muted-foreground)] mt-1">
                          Create your first receipt or invoice to get started.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    recentDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                        <td className="py-3 px-4 font-mono font-bold">{doc.documentNumber}</td>
                        <td className="py-3 px-4 uppercase text-[11px] font-semibold tracking-wide">
                          {doc.documentType}
                        </td>
                        <td className="py-3 px-4">{doc.customer?.name || 'Walk-in'}</td>
                        <td className="py-3 px-4 text-[var(--muted-foreground)]">{formatDate(doc.issueDate)}</td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {formatCurrency(doc.totalMinor, doc.currency)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge status={doc.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenPreview(doc.id, doc.documentNumber, doc.status)}
                              title="Live Preview"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => api.downloadDocument(doc.id, `${doc.documentNumber}.pdf`)}
                              title="Download PDF"
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
          </Card>
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

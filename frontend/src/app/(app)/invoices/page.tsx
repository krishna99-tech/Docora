'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Eye, Download, CheckCircle, XCircle, FileSpreadsheet } from 'lucide-react';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PDFViewerModal } from '@/components/pdf/pdf-viewer-modal';

export default function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [previewDocNumber, setPreviewDocNumber] = useState<string>('');
  const [previewIsDraft, setPreviewIsDraft] = useState<boolean>(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['invoices', search, statusFilter, page],
    queryFn: () =>
      api.listInvoices({
        search,
        status: statusFilter,
        page,
        pageSize: 15,
      }),
  });

  const handleOpenPreview = (id: string, num: string, status: string) => {
    setPreviewDocId(id);
    setPreviewDocNumber(num);
    setPreviewIsDraft(status === 'draft');
  };

  const handleFinalize = async (id: string) => {
    if (!confirm('Are you sure you want to finalize this invoice? It will become an issued official claim.')) return;
    try {
      await api.finalizeInvoice(id);
      refetch();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this invoice?')) return;
    try {
      await api.cancelInvoice(id);
      refetch();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Invoices"
        description="Issue professional B2B invoices, set due dates, and track payment status"
        action={{ label: 'New Invoice', href: '/invoices/new' }}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search invoice # or client..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto px-3 py-2 text-xs rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="issued">Issued</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Invoices Table */}
        <Card className="p-0 overflow-hidden hidden sm:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-secondary)] border-b border-[var(--border)] text-[var(--muted-foreground)] uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--foreground)]">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[var(--muted-foreground)]">
                      Loading invoices...
                    </td>
                  </tr>
                ) : !data || data.data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <FileSpreadsheet className="w-10 h-10 text-[var(--muted-foreground)] mx-auto mb-2" />
                      <p className="font-semibold text-sm">No invoices found</p>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">
                        Create an invoice to bill your clients.
                      </p>
                      <Link href="/invoices/new">
                        <Button size="sm" variant="default" className="mt-4">
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Create First Invoice
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ) : (
                  data.data.map((doc) => (
                    <tr key={doc.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold">
                        <Link href={`/invoices/${doc.id}`} className="hover:underline">
                          {doc.documentNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-semibold">{doc.customer?.name || 'Walk-in'}</td>
                      <td className="py-3 px-4 text-[var(--muted-foreground)]">{formatDate(doc.issueDate)}</td>
                      <td className="py-3 px-4 text-[var(--muted-foreground)]">
                        {doc.dueDate ? formatDate(doc.dueDate) : 'On Receipt'}
                      </td>
                      <td className="py-3 px-4 text-right">{formatCurrency(doc.totalMinor, doc.currency)}</td>
                      <td className="py-3 px-4 text-right font-bold">
                        <span className={doc.balanceMinor > 0 ? 'text-amber-500' : 'text-emerald-500'}>
                          {formatCurrency(doc.balanceMinor, doc.currency)}
                        </span>
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
                            title="Preview PDF"
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
                          {doc.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleFinalize(doc.id)}
                              title="Finalize Invoice"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            </Button>
                          )}
                          {doc.status !== 'cancelled' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCancel(doc.id)}
                              title="Cancel Invoice"
                            >
                              <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-[var(--border)] bg-[var(--surface-secondary)] text-xs">
              <span className="text-[var(--muted-foreground)]">
                Page {data.page} of {data.totalPages} ({data.total} total)
              </span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={data.page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={data.page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Mobile Invoices Card View (< 640px) */}
        <div className="sm:hidden space-y-3">
          {isLoading ? (
            <Card className="p-8 text-center text-xs text-[var(--muted-foreground)]">
              Loading invoices...
            </Card>
          ) : !data || data.data.length === 0 ? (
            <Card className="p-8 text-center">
              <FileSpreadsheet className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-2" />
              <p className="font-semibold text-xs">No invoices found</p>
              <Link href="/invoices/new">
                <Button size="sm" variant="default" className="mt-3">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  New Invoice
                </Button>
              </Link>
            </Card>
          ) : (
            data.data.map((doc) => (
              <Card key={doc.id} className="p-4 space-y-2.5 border border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <Link href={`/invoices/${doc.id}`} className="font-mono font-bold text-xs hover:underline">
                    {doc.documentNumber}
                  </Link>
                  <Badge status={doc.status} />
                </div>
                <div className="text-xs text-[var(--muted-foreground)] flex items-center justify-between">
                  <span>{doc.customer?.name || 'Walk-in Client'}</span>
                  <span>Due: {formatDate(doc.dueDate)}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--border)]">
                  <div>
                    <span className="text-[10px] text-[var(--muted-foreground)] block">Balance Due</span>
                    <span className="font-bold text-xs text-[var(--foreground)]">
                      {formatCurrency(doc.balanceMinor, doc.currency)}
                    </span>
                  </div>
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

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs">
              <Button
                size="sm"
                variant="outline"
                disabled={data.page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-[var(--muted-foreground)] text-xs">
                {data.page} / {data.totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={data.page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      <PDFViewerModal
        isOpen={Boolean(previewDocId)}
        onClose={() => setPreviewDocId(null)}
        documentId={previewDocId}
        documentNumber={previewDocNumber}
        isDraft={previewIsDraft}
        onFinalized={() => refetch()}
      />
    </div>
  );
}

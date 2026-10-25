'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Eye, Download, CheckCircle, XCircle, ArrowUpDown, Receipt } from 'lucide-react';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PDFViewerModal } from '@/components/pdf/pdf-viewer-modal';
import { TablePagination } from '@/components/ui/table-pagination';

export default function ReceiptsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [previewDocNumber, setPreviewDocNumber] = useState<string>('');
  const [previewIsDraft, setPreviewIsDraft] = useState<boolean>(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['receipts', search, statusFilter, page],
    queryFn: () =>
      api.listReceipts({
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
    if (!confirm('Are you sure you want to finalize this receipt? This will issue the official document number and lock modifications.')) {
      return;
    }
    try {
      await api.finalizeReceipt(id);
      refetch();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel/void this receipt?')) {
      return;
    }
    try {
      await api.cancelReceipt(id);
      refetch();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Receipts"
        description="Issue, manage, and print official retail and service receipts"
        action={{ label: 'New Receipt', href: '/receipts/new' }}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full">
        {/* Filters and search bar */}
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
              placeholder="Search receipt # or customer..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-ring"
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
              <option value="finalized">Finalized</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Desktop & Tablet Table */}
        <Card className="p-0 overflow-hidden hidden sm:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-secondary)] border-b border-[var(--border)] text-[var(--muted-foreground)] uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--foreground)]">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[var(--muted-foreground)]">
                      Loading receipts...
                    </td>
                  </tr>
                ) : !data || data.data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <Receipt className="w-10 h-10 text-[var(--muted-foreground)] mx-auto mb-2" />
                      <p className="font-semibold text-sm">No receipts found</p>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">
                        Create a receipt to start recording transactions.
                      </p>
                      <Link href="/receipts/new">
                        <Button size="sm" variant="default" className="mt-4">
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Create First Receipt
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ) : (
                  data.data.map((doc) => (
                    <tr key={doc.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold">
                        <Link href={`/receipts/${doc.id}`} className="hover:underline">
                          {doc.documentNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4">{doc.customer?.name || 'Walk-in Customer'}</td>
                      <td className="py-3 px-4 text-[var(--muted-foreground)]">{formatDate(doc.issueDate)}</td>
                      <td className="py-3 px-4 capitalize">{doc.paymentMethod || 'Standard'}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(doc.subtotalMinor, doc.currency)}</td>
                      <td className="py-3 px-4 text-right font-bold">
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
                              title="Finalize Receipt"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            </Button>
                          )}
                          {doc.status !== 'cancelled' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCancel(doc.id)}
                              title="Cancel / Void"
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

          {/* Pagination */}
          {data && (
            <TablePagination
              page={data.page}
              totalPages={data.totalPages}
              totalItems={data.total}
              pageSize={15}
              onPageChange={setPage}
              itemName="receipts"
            />
          )}
        </Card>

        {/* Mobile Cards View (< 640px) */}
        <div className="sm:hidden space-y-3">
          {isLoading ? (
            <Card className="p-8 text-center text-xs text-[var(--muted-foreground)]">
              Loading receipts...
            </Card>
          ) : !data || data.data.length === 0 ? (
            <Card className="p-8 text-center">
              <Receipt className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-2" />
              <p className="font-semibold text-xs">No receipts found</p>
              <Link href="/receipts/new">
                <Button size="sm" variant="default" className="mt-3">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  New Receipt
                </Button>
              </Link>
            </Card>
          ) : (
            data.data.map((doc) => (
              <Card key={doc.id} className="p-4 space-y-2.5 border border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <Link href={`/receipts/${doc.id}`} className="font-mono font-bold text-xs hover:underline">
                    {doc.documentNumber}
                  </Link>
                  <Badge status={doc.status} />
                </div>
                <div className="text-xs text-[var(--muted-foreground)] flex items-center justify-between">
                  <span>{doc.customer?.name || 'Walk-in Customer'}</span>
                  <span>{formatDate(doc.issueDate)}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--border)]">
                  <div>
                    <span className="text-[10px] text-[var(--muted-foreground)] block">Total</span>
                    <span className="font-bold text-xs text-[var(--foreground)]">
                      {formatCurrency(doc.totalMinor, doc.currency)}
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

          {data && (
            <TablePagination
              page={data.page}
              totalPages={data.totalPages}
              totalItems={data.total}
              pageSize={15}
              onPageChange={setPage}
              itemName="receipts"
            />
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

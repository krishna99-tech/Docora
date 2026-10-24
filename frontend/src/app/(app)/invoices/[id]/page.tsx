'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Eye, Download, CheckCircle, XCircle, FileSpreadsheet, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PDFViewerModal } from '@/components/pdf/pdf-viewer-modal';

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const { data: doc, isLoading, refetch } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => api.getInvoice(id),
    enabled: Boolean(id),
  });

  const handleFinalize = async () => {
    if (!confirm('Are you sure you want to finalize and issue this invoice?')) return;
    setIsActionLoading(true);
    try {
      await api.finalizeInvoice(id);
      refetch();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this invoice?')) return;
    setIsActionLoading(true);
    try {
      await api.cancelInvoice(id);
      refetch();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-xs text-[var(--muted-foreground)]">Loading invoice details...</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex-1 p-8 text-center">
        <p className="text-sm font-semibold">Invoice not found</p>
        <Link href="/invoices">
          <Button variant="ghost" size="sm" className="mt-2">
            Back to Invoices
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title={`Invoice #${doc.documentNumber}`}
        description={`Status: ${doc.status.toUpperCase()} | Issued: ${formatDate(doc.issueDate)}`}
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Navigation & Actions Topbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Link href="/invoices" className="self-start">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              All Invoices
            </Button>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {doc.status === 'draft' && (
              <Link href={`/invoices/${doc.id}/edit`}>
                <Button variant="outline" size="sm">
                  Edit Draft
                </Button>
              </Link>
            )}

            <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(true)}>
              <Eye className="w-3.5 h-3.5 mr-1" />
              Preview PDF
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => api.downloadDocument(doc.id, `${doc.documentNumber}.pdf`)}
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Download PDF
            </Button>

            {doc.status === 'draft' && (
              <Button
                variant="default"
                size="sm"
                onClick={handleFinalize}
                isLoading={isActionLoading}
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                Finalize & Issue
              </Button>
            )}

            {doc.status !== 'cancelled' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                isLoading={isActionLoading}
                className="text-red-500 hover:text-red-600"
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                Cancel Invoice
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[var(--surface-secondary)] text-[var(--foreground)]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-[var(--muted-foreground)]">Invoice No.</div>
              <div className="font-mono font-bold text-sm">{doc.documentNumber}</div>
            </div>
          </Card>

          <Card className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[var(--surface-secondary)] text-[var(--foreground)]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-[var(--muted-foreground)]">Due Date</div>
              <div className="font-bold text-sm">{doc.dueDate ? formatDate(doc.dueDate) : 'On Receipt'}</div>
            </div>
          </Card>

          <Card className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[var(--surface-secondary)] text-[var(--foreground)]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-[var(--muted-foreground)]">Amount Due</div>
              <div className="font-bold text-sm text-amber-500">
                {formatCurrency(doc.balanceMinor, doc.currency)}
              </div>
            </div>
          </Card>

          <Card className="flex items-center gap-3">
            <div>
              <div className="text-[10px] uppercase font-bold text-[var(--muted-foreground)]">Status</div>
              <div className="mt-1">
                <Badge status={doc.status} />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Billed Recipient</CardTitle>
            </CardHeader>
            <div className="text-xs space-y-1.5">
              <p className="font-bold text-sm text-[var(--foreground)]">
                {doc.customer?.name || 'Customer Not Specified'}
              </p>
              {doc.customer?.email && (
                <p className="text-[var(--muted-foreground)]">Email: {doc.customer.email}</p>
              )}
              {doc.customer?.phone && (
                <p className="text-[var(--muted-foreground)]">Phone: {doc.customer.phone}</p>
              )}
              {doc.customer?.address && (
                <p className="text-[var(--muted-foreground)]">Address: {doc.customer.address}</p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Payment Status & Terms</CardTitle>
            </CardHeader>
            <div className="text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Payment Method:</span>
                <span className="font-semibold">{doc.paymentMethod || 'Bank Wire'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Total Invoice:</span>
                <span className="font-semibold">{formatCurrency(doc.totalMinor, doc.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Amount Paid:</span>
                <span className="font-semibold text-emerald-600">{formatCurrency(doc.amountPaidMinor, doc.currency)}</span>
              </div>
              <div className="flex justify-between border-t border-[var(--border)] pt-1">
                <span className="text-[var(--muted-foreground)] font-bold">Balance Remaining:</span>
                <span className="font-bold text-amber-500">{formatCurrency(doc.balanceMinor, doc.currency)}</span>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] font-bold text-sm">
            Billed Items & Services
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead className="bg-[var(--surface-secondary)] border-b border-[var(--border)] text-[var(--muted-foreground)] uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Tax Rate</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {doc.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 px-4 font-semibold">{item.description}</td>
                    <td className="py-3 px-4 text-center">{item.quantity}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(item.unitPriceMinor, doc.currency)}</td>
                    <td className="py-3 px-4 text-right">{(item.taxRate * 100).toFixed(1)}%</td>
                    <td className="py-3 px-4 text-right font-bold">
                      {formatCurrency(item.lineTotalMinor, doc.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 sm:p-6 bg-[var(--surface-secondary)] border-t border-[var(--border)] flex justify-end">
            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-[var(--muted-foreground)]">
                <span>Subtotal:</span>
                <span className="font-semibold text-[var(--foreground)]">
                  {formatCurrency(doc.subtotalMinor, doc.currency)}
                </span>
              </div>
              {doc.taxMinor > 0 && (
                <div className="flex justify-between text-[var(--muted-foreground)]">
                  <span>Tax:</span>
                  <span className="font-semibold text-[var(--foreground)]">
                    {formatCurrency(doc.taxMinor, doc.currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold pt-2 border-t border-[var(--border)] text-[var(--foreground)]">
                <span>Total Due:</span>
                <span>{formatCurrency(doc.totalMinor, doc.currency)}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <PDFViewerModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        documentId={doc.id}
        documentNumber={doc.documentNumber}
        isDraft={doc.status === 'draft'}
        onFinalized={() => refetch()}
      />
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Eye, Download, CheckCircle, XCircle, FileText, Calendar, CreditCard, Printer } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { PDFViewerModal } from '@/components/pdf/pdf-viewer-modal';
import { DocumentPreviewContainer } from '@/components/preview/document-preview-container';
import { InvoicePreview } from '@/components/preview/invoice-preview';
import { useConfirm } from '@/components/ui/confirm-dialog';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const confirm = useConfirm();

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const { data: doc, isLoading, refetch } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => api.getInvoice(id),
    enabled: Boolean(id),
  });

  const { data: businessProfile } = useQuery({
    queryKey: ['business-profile'],
    queryFn: () => api.getBusinessProfile(),
  });

  const handleFinalize = async () => {
    const ok = await confirm({
      title: 'Issue & Finalize Invoice',
      message: 'Are you sure you want to finalize and issue this invoice? This will lock the document permanently.',
      itemName: doc?.documentNumber || id,
      itemType: 'Invoice',
      confirmText: 'Issue Invoice',
      variant: 'primary',
    });
    if (!ok) return;

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
    const ok = await confirm({
      title: 'Void Invoice',
      message: 'Are you sure you want to void/cancel this invoice? This action cannot be undone.',
      itemName: doc?.documentNumber || id,
      itemType: 'Invoice',
      confirmText: 'Void Invoice',
      variant: 'danger',
    });
    if (!ok) return;

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

  const itemsForPreview = (doc.items || []).map((it) => ({
    description: it.description,
    quantity: it.quantity,
    unitPrice: it.unitPriceMinor / 100,
    discount: it.discountMinor / 100,
    taxRate: it.taxRate,
  }));

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title={`Invoice #${doc.documentNumber}`}
        description={`Status: ${doc.status.toUpperCase()} | Created: ${formatDate(doc.createdAt)}`}
        backHref="/invoices"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Navigation & Actions Topbar */}
        <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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

            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="w-3.5 h-3.5 mr-1" />
              Print Invoice
            </Button>

            <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(true)}>
              <Eye className="w-3.5 h-3.5 mr-1" />
              PDF Modal
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

        {/* Overview Banner (No Print) */}
        <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="flex items-center gap-3 p-3.5 sm:p-4">
            <div className="p-2.5 rounded-lg bg-[var(--surface-secondary)] text-[var(--foreground)]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-[var(--muted-foreground)]">Invoice No.</div>
              <div className="font-mono font-bold text-sm">{doc.documentNumber}</div>
            </div>
          </Card>

          <Card className="flex items-center gap-3 p-3.5 sm:p-4">
            <div className="p-2.5 rounded-lg bg-[var(--surface-secondary)] text-[var(--foreground)]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-[var(--muted-foreground)]">Due Date</div>
              <div className="font-bold text-sm">{doc.dueDate ? formatDate(doc.dueDate) : 'N/A'}</div>
            </div>
          </Card>

          <Card className="flex items-center gap-3 p-3.5 sm:p-4">
            <div className="p-2.5 rounded-lg bg-[var(--surface-secondary)] text-[var(--foreground)]">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-[var(--muted-foreground)]">Settlement</div>
              <div className="font-bold text-sm">{doc.paymentMethod || 'Bank Wire'}</div>
            </div>
          </Card>

          <Card className="flex items-center gap-3 p-3.5 sm:p-4">
            <div>
              <div className="text-[10px] uppercase font-bold text-[var(--muted-foreground)]">Status</div>
              <div className="mt-1">
                <Badge status={doc.status} />
              </div>
            </div>
          </Card>
        </div>

        {/* Canonical Live Document Preview & Print Sheet */}
        <div className="w-full">
          <DocumentPreviewContainer
            title="Commercial Invoice Document"
            documentNumber={doc.documentNumber}
            documentId={doc.id}
            isDraft={doc.status === 'draft'}
          >
            <InvoicePreview
              documentNumber={doc.documentNumber}
              status={doc.status}
              issueDate={doc.issueDate}
              dueDate={doc.dueDate}
              currency={doc.currency}
              paymentMethod={doc.paymentMethod}
              paymentReference={doc.paymentReference}
              customer={doc.customer}
              business={businessProfile}
              items={itemsForPreview}
              amountPaid={doc.amountPaidMinor / 100}
              notes={doc.notes}
              terms={doc.terms}
            />
          </DocumentPreviewContainer>
        </div>
      </div>

      <PDFViewerModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        documentId={doc.id}
        documentNumber={doc.documentNumber}
        documentType="invoice"
        isDraft={doc.status === 'draft'}
        onFinalized={() => refetch()}
      />
    </div>
  );
}

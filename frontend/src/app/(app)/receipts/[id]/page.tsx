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
import { ReceiptPreview } from '@/components/preview/receipt-preview';

export default function ReceiptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const { data: doc, isLoading, refetch } = useQuery({
    queryKey: ['receipt', id],
    queryFn: () => api.getReceipt(id),
    enabled: Boolean(id),
  });

  const { data: businessProfile } = useQuery({
    queryKey: ['business-profile'],
    queryFn: () => api.getBusinessProfile(),
  });

  const handleFinalize = async () => {
    if (!confirm('Are you sure you want to finalize this receipt? This will seal the document.')) return;
    setIsActionLoading(true);
    try {
      await api.finalizeReceipt(id);
      refetch();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this receipt?')) return;
    setIsActionLoading(true);
    try {
      await api.cancelReceipt(id);
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
        <p className="text-xs text-[var(--muted-foreground)]">Loading receipt details...</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex-1 p-8 text-center">
        <p className="text-sm font-semibold">Receipt not found</p>
        <Link href="/receipts">
          <Button variant="ghost" size="sm" className="mt-2">
            Back to Receipts
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
        title={`Receipt #${doc.documentNumber}`}
        description={`Status: ${doc.status.toUpperCase()} | Created: ${formatDate(doc.createdAt)}`}
        backHref="/receipts"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Navigation & Actions Topbar */}
        <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Link href="/receipts" className="self-start">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              All Receipts
            </Button>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {doc.status === 'draft' && (
              <Link href={`/receipts/${doc.id}/edit`}>
                <Button variant="outline" size="sm">
                  Edit Draft
                </Button>
              </Link>
            )}

            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="w-3.5 h-3.5 mr-1" />
              Print Receipt
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
                Finalize Receipt
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
                Cancel Receipt
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
              <div className="text-[10px] uppercase font-bold text-[var(--muted-foreground)]">Document No.</div>
              <div className="font-mono font-bold text-sm">{doc.documentNumber}</div>
            </div>
          </Card>

          <Card className="flex items-center gap-3 p-3.5 sm:p-4">
            <div className="p-2.5 rounded-lg bg-[var(--surface-secondary)] text-[var(--foreground)]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-[var(--muted-foreground)]">Receipt Date</div>
              <div className="font-bold text-sm">{formatDate(doc.issueDate)}</div>
            </div>
          </Card>

          <Card className="flex items-center gap-3 p-3.5 sm:p-4">
            <div className="p-2.5 rounded-lg bg-[var(--surface-secondary)] text-[var(--foreground)]">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-[var(--muted-foreground)]">Payment Method</div>
              <div className="font-bold text-sm">{doc.paymentMethod || 'Standard'}</div>
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
            title="Official Receipt Document"
            documentNumber={doc.documentNumber}
            documentId={doc.id}
            isDraft={doc.status === 'draft'}
          >
            <ReceiptPreview
              documentNumber={doc.documentNumber}
              status={doc.status}
              issueDate={doc.issueDate}
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
        documentType="receipt"
        isDraft={doc.status === 'draft'}
        onFinalized={() => refetch()}
      />
    </div>
  );
}

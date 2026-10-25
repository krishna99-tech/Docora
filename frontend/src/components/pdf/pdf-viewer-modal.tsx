'use client';

import React, { useEffect, useState } from 'react';
import { Download, Printer, CheckCircle, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { PDFPreviewRenderer } from '@/components/pdf/pdf-preview-renderer';
import { api } from '@/lib/api';

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string | null;
  documentNumber?: string;
  documentType?: 'receipt' | 'invoice' | 'general';
  isDraft?: boolean;
  onFinalized?: () => void;
}

export function PDFViewerModal({
  isOpen,
  onClose,
  documentId,
  documentNumber,
  documentType = 'receipt',
  isDraft,
  onFinalized,
}: PDFViewerModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const loadPreview = () => {
    if (!documentId) return;
    setIsLoading(true);
    setError(null);

    api
      .getDocumentPreviewBlob(documentId)
      .then((blob) => {
        // Enforce application/pdf MIME type for Brave Browser compatibility
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        const url = URL.createObjectURL(pdfBlob);
        setBlobUrl(url);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load PDF preview');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen && documentId) {
      loadPreview();
    }

    return () => {
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [isOpen, documentId]);

  const handleDownload = () => {
    if (!documentId) return;
    const filename = `${documentNumber || 'document'}.pdf`;
    api.downloadDocument(documentId, filename);
  };

  const handlePrint = () => {
    if (!blobUrl) return;
    try {
      const iframe = document.getElementById('pdf-preview-frame') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        return;
      }
    } catch {
      // In case iframe print is restricted by browser plugin sandbox
    }

    const printWin = window.open(blobUrl, '_blank');
    if (printWin) {
      printWin.focus();
      try {
        printWin.print();
      } catch {
        // Handled by browser PDF viewer toolbar
      }
    }
  };

  const handleFinalize = async () => {
    if (!documentId) return;
    try {
      setIsFinalizing(true);
      if (documentType === 'invoice') {
        await api.finalizeInvoice(documentId);
      } else {
        await api.finalizeReceipt(documentId);
      }
      if (onFinalized) onFinalized();
      onClose();
    } catch (err: any) {
      alert(`Finalization error: ${err.message}`);
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Document Preview ${documentNumber ? `(#${documentNumber})` : ''}`}
      description="Inspect generated layout, line items, and monetary totals before downloading or printing."
      maxWidth="4xl"
    >
      <div className="flex flex-col h-[65vh] sm:h-[75vh]">
        {/* Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={isLoading || !blobUrl} className="text-xs">
              <Download className="w-3.5 h-3.5 mr-1 shrink-0" />
              <span>Download<span className="hidden xs:inline"> PDF</span></span>
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} disabled={isLoading || !blobUrl} className="text-xs">
              <Printer className="w-3.5 h-3.5 mr-1 shrink-0" />
              <span>Print</span>
            </Button>
          </div>

          {isDraft && (
            <Button
              variant="default"
              size="sm"
              onClick={handleFinalize}
              isLoading={isFinalizing}
              disabled={isLoading || !blobUrl}
              className="text-xs"
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
              <span>Finalize<span className="hidden sm:inline"> Document</span></span>
            </Button>
          )}
        </div>

        {/* Viewer content */}
        <div className="flex-1 w-full bg-[var(--surface-secondary)] rounded-lg overflow-hidden relative flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 text-[var(--muted-foreground)]">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-medium">Rendering PDF preview...</span>
            </div>
          ) : (
            <PDFPreviewRenderer
              blobUrl={blobUrl}
              documentId={documentId}
              documentNumber={documentNumber}
              isDraft={isDraft}
              onDownload={handleDownload}
              onPrint={handlePrint}
              onRetry={loadPreview}
              errorMessage={error}
            />
          )}
        </div>
      </div>
    </Modal>
  );
}

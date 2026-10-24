'use client';

import React, { useEffect, useState } from 'react';
import { Download, Printer, CheckCircle, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string | null;
  documentNumber?: string;
  isDraft?: boolean;
  onFinalized?: () => void;
}

export function PDFViewerModal({
  isOpen,
  onClose,
  documentId,
  documentNumber,
  isDraft,
  onFinalized,
}: PDFViewerModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);

  useEffect(() => {
    let activeUrl: string | null = null;

    if (isOpen && documentId) {
      setIsLoading(true);
      setError(null);

      api
        .getDocumentPreviewBlob(documentId)
        .then((blob) => {
          activeUrl = URL.createObjectURL(blob);
          setBlobUrl(activeUrl);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load PDF preview');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }

    return () => {
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
      setBlobUrl(null);
    };
  }, [isOpen, documentId]);

  const handleDownload = () => {
    if (!documentId) return;
    const filename = `${documentNumber || 'document'}.pdf`;
    api.downloadDocument(documentId, filename);
  };

  const handlePrint = () => {
    if (blobUrl) {
      const iframe = document.getElementById('pdf-preview-frame') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.print();
      } else {
        window.open(blobUrl, '_blank')?.print();
      }
    }
  };

  const handleFinalize = async () => {
    if (!documentId) return;
    try {
      setIsFinalizing(true);
      await api.finalizeReceipt(documentId);
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
      <div className="flex flex-col h-[75vh]">
        {/* Actions Bar */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={isLoading || !blobUrl}>
              <Download className="w-3.5 h-3.5 mr-1" />
              Download PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} disabled={isLoading || !blobUrl}>
              <Printer className="w-3.5 h-3.5 mr-1" />
              Print
            </Button>
          </div>

          {isDraft && (
            <Button
              variant="default"
              size="sm"
              onClick={handleFinalize}
              isLoading={isFinalizing}
              disabled={isLoading || !blobUrl}
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1" />
              Finalize Document
            </Button>
          )}
        </div>

        {/* Viewer content */}
        <div className="flex-1 w-full bg-[var(--surface-secondary)] rounded-lg border border-[var(--border)] overflow-hidden relative flex items-center justify-center">
          {isLoading && (
            <div className="flex flex-col items-center gap-2 text-[var(--muted-foreground)]">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-medium">Rendering PDF preview...</span>
            </div>
          )}

          {error && (
            <div className="p-6 text-center max-w-md">
              <p className="text-sm text-red-500 font-semibold mb-1">Failed to generate PDF</p>
              <p className="text-xs text-[var(--muted-foreground)]">{error}</p>
            </div>
          )}

          {!isLoading && !error && blobUrl && (
            <iframe
              id="pdf-preview-frame"
              src={blobUrl}
              className="w-full h-full border-0 rounded-lg"
              title="PDF Preview"
            />
          )}
        </div>
      </div>
    </Modal>
  );
}

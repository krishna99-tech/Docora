'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Printer, Download, ZoomIn, ZoomOut, Maximize2, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface DocumentPreviewContainerProps {
  title?: string;
  documentId?: string;
  documentNumber?: string;
  isDraft?: boolean;
  children: React.ReactNode;
  onRefresh?: () => void;
  isUpdating?: boolean;
}

export function DocumentPreviewContainer({
  title = 'Document Preview',
  documentId,
  documentNumber,
  isDraft = true,
  children,
  onRefresh,
  isUpdating = false,
}: DocumentPreviewContainerProps) {
  const [scale, setScale] = useState<number>(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-fit scale on mount or window resize for smaller screens
  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 32; // padding
        const targetWidth = 794; // Standard A4 width at 96 DPI
        if (containerWidth < targetWidth) {
          const autoScale = Math.max(0.4, Math.min(1, containerWidth / targetWidth));
          setScale(Number(autoScale.toFixed(2)));
        } else {
          setScale(1);
        }
      }
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!documentId) return;
    try {
      setIsDownloading(true);
      await api.downloadDocument(documentId, `${documentNumber || 'document'}.pdf`);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const zoomIn = () => setScale((prev) => Math.min(1.5, Number((prev + 0.1).toFixed(2))));
  const zoomOut = () => setScale((prev) => Math.max(0.4, Number((prev - 0.1).toFixed(2))));
  const resetZoom = () => setScale(1);

  return (
    <div className="flex flex-col h-full bg-[var(--surface-secondary)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm print:border-none print:bg-transparent print:shadow-none print:rounded-none print:overflow-visible print:h-auto print:p-0 print:m-0">
      {/* Preview Top Toolbar (Hidden on Print) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
            {title}
          </span>
          {documentNumber && (
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--muted-foreground)]">
              #{documentNumber}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Synced
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center gap-1 bg-[var(--surface-secondary)] px-1.5 py-0.5 rounded-md border border-[var(--border)]">
            <button
              onClick={zoomOut}
              className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-40"
              disabled={scale <= 0.4}
              title="Zoom out"
              type="button"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono w-10 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-40"
              disabled={scale >= 1.5}
              title="Zoom in"
              type="button"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetZoom}
              className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              title="Reset scale"
              type="button"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>

          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="h-8 px-2 text-xs"
              title="Refresh"
              type="button"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-8 text-xs font-semibold"
            type="button"
          >
            <Printer className="w-3.5 h-3.5 mr-1" />
            Print
          </Button>

          {documentId && (
            <Button
              variant="default"
              size="sm"
              onClick={handleDownload}
              isLoading={isDownloading}
              className="h-8 text-xs font-semibold"
              type="button"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Download PDF
            </Button>
          )}
        </div>
      </div>

      {/* Scaled Preview Canvas Wrapper */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-3 sm:p-6 flex items-start justify-center relative min-h-[500px] print:p-0 print:m-0 print:overflow-visible print:min-h-0 print:block"
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
            width: '794px',
            minHeight: '1123px',
          }}
          className="printable-area shrink-0 print:w-full print:max-w-none print:m-0 print:p-0 print:transform-none print:min-h-0"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useMemo, useState } from 'react';
import { GeneralPDFSection, BusinessProfile } from '@/types';
import { formatDate } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Layers, FileText } from 'lucide-react';

export interface GeneralDocPreviewProps {
  title: string;
  subtitle?: string;
  pageSize?: string;
  orientation?: string;
  margin?: string;
  includeHeader?: boolean;
  includeFooter?: boolean;
  includePageNumbers?: boolean;
  sections: GeneralPDFSection[];
  business?: BusinessProfile | null;
  documentNumber?: string;
}

/**
 * Calculates estimated vertical pixel weight for a section to determine
 * realistic A4 page pagination boundaries.
 */
function getSectionWeight(section: GeneralPDFSection): number {
  switch (section.type) {
    case 'heading':
      return 60;
    case 'paragraph': {
      const textLen = (section.content || '').length;
      const lines = Math.ceil(textLen / 85) || 1;
      return lines * 22 + 30;
    }
    case 'table': {
      const rows = section.rows?.length || 0;
      return 55 + rows * 36;
    }
    case 'key_value': {
      const pairs = section.pairs?.length || 0;
      const rows = Math.ceil(pairs / 2) || 1;
      return rows * 34 + 40;
    }
    case 'divider':
      return 35;
    case 'spacer':
      return 30;
    default:
      return 40;
  }
}

/**
 * Splits sections across distinct A4 pages based on capacity.
 */
function paginateSections(sections: GeneralPDFSection[]): GeneralPDFSection[][] {
  if (sections.length === 0) return [[]];

  const pages: GeneralPDFSection[][] = [];
  let currentPage: GeneralPDFSection[] = [];
  let currentWeight = 0;
  // Page 1 has main header (more reserved space); subsequent pages have compact header
  const maxWeightPage1 = 820;
  const maxWeightSubsequent = 880;

  for (const sec of sections) {
    const secWeight = getSectionWeight(sec);
    const maxWeight = pages.length === 0 ? maxWeightPage1 : maxWeightSubsequent;

    if (currentPage.length > 0 && currentWeight + secWeight > maxWeight) {
      pages.push(currentPage);
      currentPage = [sec];
      currentWeight = secWeight;
    } else {
      currentPage.push(sec);
      currentWeight += secWeight;
    }
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
}

export function GeneralDocPreview({
  title,
  subtitle,
  pageSize = 'A4',
  orientation = 'portrait',
  includeHeader = true,
  includeFooter = true,
  includePageNumbers = true,
  sections = [],
  business,
  documentNumber = 'DOC-PREVIEW',
}: GeneralDocPreviewProps) {
  const currentDate = formatDate(new Date().toISOString());

  // Distribute sections across pages
  const pages = useMemo(() => paginateSections(sections), [sections]);
  const totalPages = pages.length;

  // Pagination view mode: 'all' (all pages stacked in a continuous scroll) or 'single' (focused flip page)
  const [activePage, setActivePage] = useState<number>(0);
  const [pageViewMode, setPageViewMode] = useState<'all' | 'single'>('all');

  return (
    <div id="printable-document" className="w-full flex flex-col items-center select-text">
      {/* Top Pagination Toolbar (Visible whenever totalPages > 1) */}
      {totalPages > 1 && (
        <div className="no-print w-full max-w-[794px] mb-6 p-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xs flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[var(--foreground)]">Multi-Page View:</span>
            <span className="text-[var(--muted-foreground)]">
              {totalPages} A4 Pages
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[var(--surface-secondary)] p-1 rounded-lg border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setPageViewMode('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  pageViewMode === 'all'
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
                title="Scroll continuously through all pages stacked vertically"
              >
                <Layers className="w-3.5 h-3.5" />
                All Pages (Stacked)
              </button>
              <button
                type="button"
                onClick={() => setPageViewMode('single')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  pageViewMode === 'single'
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
                title="View one page at a time with page switcher"
              >
                <FileText className="w-3.5 h-3.5" />
                Single Page Flip
              </button>
            </div>

            {/* In Single Page mode: Prev / Next buttons. In All Pages mode: Clickable page jumpers */}
            {pageViewMode === 'single' ? (
              <div className="flex items-center gap-1 bg-[var(--surface-secondary)] p-1 rounded-lg border border-[var(--border)]">
                <button
                  type="button"
                  disabled={activePage === 0}
                  onClick={() => setActivePage((prev) => Math.max(0, prev - 1))}
                  className="p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-30 transition-colors"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-mono text-xs font-bold text-[var(--foreground)]">
                  Page {activePage + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={activePage === totalPages - 1}
                  onClick={() => setActivePage((prev) => Math.min(totalPages - 1, prev + 1))}
                  className="p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-30 transition-colors"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {pages.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(`docora-page-${i + 1}`);
                      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="px-2.5 py-1 rounded text-xs font-mono font-medium bg-[var(--surface-secondary)] hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] border border-[var(--border)] transition-colors"
                    title={`Jump to Page ${i + 1}`}
                  >
                    Page {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Render Pages (In 'all' mode: all pages stack with visible breaks. In print mode: ALL pages ALWAYS print) */}
      <div className="w-full flex flex-col items-center space-y-8">
        {pages.map((pageSections, pageIndex) => {
          const isHiddenInSingleView = pageViewMode === 'single' && pageIndex !== activePage;

          return (
            <div
              key={pageIndex}
              id={`docora-page-${pageIndex + 1}`}
              className={`print-document-sheet print-page relative bg-white text-[#111111] p-12 font-sans shadow-lg border border-neutral-200 rounded-sm w-[794px] min-h-[1123px] box-border text-[13px] leading-relaxed flex flex-col justify-between print:mb-0 print:border-none print:shadow-none print:!flex ${
                isHiddenInSingleView ? 'hidden' : 'flex'
              }`}
              style={{ breakAfter: pageIndex < totalPages - 1 ? 'page' : 'auto' }}
            >
              {/* Page Number Indicator Badge (Top Right) */}
              {totalPages > 1 && (
                <div className="no-print absolute top-3 right-4 text-[10px] font-mono font-medium text-neutral-400 bg-neutral-50 border border-neutral-200 px-2 py-0.5 rounded">
                  Page {pageIndex + 1} of {totalPages}
                </div>
              )}

              <div>
                {/* Header: Full header on Page 1, compact running header on subsequent pages */}
                {includeHeader && pageIndex === 0 && (
                  <div className="border-b-2 border-[#111111] pb-5 mb-8 flex justify-between items-start avoid-break">
                    <div>
                      <h1 className="text-2xl font-black tracking-tight text-[#111111]">
                        {title || 'Untitled Document'}
                      </h1>
                      {subtitle && (
                        <p className="text-xs text-[#555555] font-medium mt-1">{subtitle}</p>
                      )}
                    </div>
                    <div className="text-right text-xs text-[#666666]">
                      <div className="font-bold text-[#111111] font-mono">#{documentNumber}</div>
                      <div>{currentDate}</div>
                      <div className="text-[10px] uppercase tracking-wider text-[#888888]">
                        {business?.businessName || 'Docora Structured Document'}
                      </div>
                    </div>
                  </div>
                )}

                {includeHeader && pageIndex > 0 && (
                  <div className="border-b border-[#e5e5e5] pb-3 mb-6 flex justify-between items-center text-xs text-[#666666] avoid-break">
                    <span className="font-semibold text-[#111111] truncate max-w-[400px]">
                      {title || 'Document'} <span className="text-[#888888] font-normal">(continued)</span>
                    </span>
                    <span className="font-mono text-[11px]">#{documentNumber}</span>
                  </div>
                )}

                {/* Dynamic Page Sections */}
                <div className="space-y-6">
                  {pageSections.map((section, idx) => {
                    switch (section.type) {
                      case 'heading':
                        return (
                          <div key={idx} className="pt-2 avoid-break">
                            <h2 className="text-base font-extrabold tracking-tight text-[#111111] border-b border-[#e5e5e5] pb-1.5 mb-2">
                              {section.title}
                            </h2>
                          </div>
                        );

                      case 'paragraph':
                        return (
                          <div key={idx} className="avoid-break">
                            <p className="text-xs text-[#333333] leading-relaxed whitespace-pre-wrap">
                              {section.content}
                            </p>
                          </div>
                        );

                      case 'key_value':
                        return (
                          <div
                            key={idx}
                            className="grid grid-cols-2 gap-3 bg-[#f8f8f8] border border-[#e5e5e5] rounded p-4 avoid-break"
                          >
                            {section.pairs?.map((pair, pIdx) => (
                              <div key={pIdx} className="flex justify-between py-1 border-b border-[#eeeeee] text-xs">
                                <span className="font-semibold text-[#555555]">{pair.key}</span>
                                <span className="font-bold text-[#111111]">{pair.value}</span>
                              </div>
                            ))}
                          </div>
                        );

                      case 'table':
                        return (
                          <div key={idx} className="overflow-hidden rounded border border-[#e5e5e5] avoid-break">
                            <table className="w-full border-collapse">
                              {section.headers && section.headers.length > 0 && (
                                <thead>
                                  <tr className="bg-[#111111] text-white text-[11px] font-bold uppercase tracking-wider">
                                    {section.headers.map((h, hIdx) => (
                                      <th key={hIdx} className="py-2.5 px-3.5 text-left">
                                        {h}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                              )}
                              <tbody>
                                {section.rows?.map((row, rIdx) => (
                                  <tr
                                    key={rIdx}
                                    className={rIdx % 2 === 1 ? 'bg-[#fafafa]' : 'bg-white'}
                                    style={{ borderBottom: '1px solid #eeeeee' }}
                                  >
                                    {row.map((cell, cIdx) => (
                                      <td key={cIdx} className="py-2.5 px-3.5 text-xs text-[#222222]">
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );

                      case 'divider':
                        return <hr key={idx} className="border-t border-[#e5e5e5] my-4 avoid-break" />;

                      case 'spacer':
                        return <div key={idx} className="h-6" />;

                      default:
                        return null;
                    }
                  })}
                </div>
              </div>

              {/* Footer on each paginated page */}
              {includeFooter && (
                <div className="mt-8 pt-4 border-t border-[#e5e5e5] flex justify-between items-center text-[11px] text-[#888888] avoid-break">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-[#333333]">
                      {business?.businessName || 'admin'}
                    </span>
                    <span>·</span>
                    <span>Confidential &amp; Proprietary</span>
                  </div>
                  {includePageNumbers && (
                    <div className="font-mono text-[11px] font-medium text-[#444444]">
                      Page {pageIndex + 1} of {totalPages}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

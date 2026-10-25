'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface TablePaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageChange: (newPage: number) => void;
  onPageSizeChange?: (newPageSize: number) => void;
  itemName?: string;
  className?: string;
}

export function TablePagination({
  page,
  totalPages,
  totalItems,
  pageSize = 10,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  itemName = 'items',
  className = '',
}: TablePaginationProps) {
  // If there are no pages and no items, do not render empty pagination
  if (totalPages <= 0 && (!totalItems || totalItems <= 0)) {
    return null;
  }

  const effectiveTotalPages = Math.max(1, totalPages);
  const startItem = totalItems !== undefined ? (page - 1) * pageSize + 1 : null;
  const endItem =
    totalItems !== undefined ? Math.min(page * pageSize, totalItems) : null;

  // Generate visible page numbers
  const getPageNumbers = (): (number | string)[] => {
    if (effectiveTotalPages <= 7) {
      return Array.from({ length: effectiveTotalPages }, (_, i) => i + 1);
    }

    if (page <= 3) {
      return [1, 2, 3, 4, '...', effectiveTotalPages];
    }

    if (page >= effectiveTotalPages - 2) {
      return [
        1,
        '...',
        effectiveTotalPages - 3,
        effectiveTotalPages - 2,
        effectiveTotalPages - 1,
        effectiveTotalPages,
      ];
    }

    return [1, '...', page - 1, page, page + 1, '...', effectiveTotalPages];
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[var(--border)] bg-[var(--surface-secondary)] text-xs text-[var(--muted-foreground)] rounded-b-xl select-none ${className}`}
    >
      {/* Left side: Item count summary & Page size selector */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        {totalItems !== undefined && totalItems > 0 ? (
          <span>
            Showing <strong className="text-[var(--foreground)]">{startItem}</strong>–
            <strong className="text-[var(--foreground)]">{endItem}</strong> of{' '}
            <strong className="text-[var(--foreground)]">{totalItems}</strong> {itemName}
          </span>
        ) : (
          <span>
            Page <strong className="text-[var(--foreground)]">{page}</strong> of{' '}
            <strong className="text-[var(--foreground)]">{effectiveTotalPages}</strong>
          </span>
        )}

        {onPageSizeChange && pageSizeOptions && pageSizeOptions.length > 0 && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[11px] hidden md:inline">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-7 text-xs rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] px-1.5 focus:outline-none"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right side: Page navigation buttons */}
      <div className="flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-end">
        {/* First Page */}
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          className="h-7 w-7 p-0 hidden xs:inline-flex border-[var(--border)] hover:bg-[var(--surface)]"
          title="First page"
          aria-label="First page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </Button>

        {/* Previous Page */}
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-7 px-2 border-[var(--border)] hover:bg-[var(--surface)] text-xs"
          title="Previous page"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5 sm:mr-0.5" />
          <span className="hidden sm:inline">Prev</span>
        </Button>

        {/* Numeric page buttons */}
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, idx) =>
            typeof p === 'number' ? (
              <Button
                key={p}
                size="sm"
                variant={p === page ? 'default' : 'outline'}
                onClick={() => onPageChange(p)}
                className={`h-7 min-w-7 px-2 text-xs font-semibold ${
                  p === page
                    ? 'bg-white text-black hover:bg-neutral-200'
                    : 'border-[var(--border)] hover:bg-[var(--surface)] text-[var(--foreground)]'
                }`}
              >
                {p}
              </Button>
            ) : (
              <span key={`ellipsis-${idx}`} className="px-1 text-[var(--muted-foreground)]">
                {p}
              </span>
            )
          )}
        </div>

        {/* Mobile current page indicator (< 640px) */}
        <span className="sm:hidden text-xs font-semibold px-2 text-[var(--foreground)]">
          {page} / {effectiveTotalPages}
        </span>

        {/* Next Page */}
        <Button
          variant="outline"
          size="sm"
          disabled={page >= effectiveTotalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-7 px-2 border-[var(--border)] hover:bg-[var(--surface)] text-xs"
          title="Next page"
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5 sm:ml-0.5" />
        </Button>

        {/* Last Page */}
        <Button
          variant="outline"
          size="sm"
          disabled={page >= effectiveTotalPages}
          onClick={() => onPageChange(effectiveTotalPages)}
          className="h-7 w-7 p-0 hidden xs:inline-flex border-[var(--border)] hover:bg-[var(--surface)]"
          title="Last page"
          aria-label="Last page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

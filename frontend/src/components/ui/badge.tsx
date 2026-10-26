import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: string;
  variant?: 'default' | 'outline' | 'success' | 'warning' | 'danger' | 'brand' | 'ocean' | 'violet';
}

export function Badge({ className, status, variant, children, ...props }: BadgeProps) {
  let computedVariant = variant || 'default';

  if (status) {
    const s = status.toLowerCase();
    if (s === 'paid' || s === 'finalized' || s === 'completed' || s === 'approved') {
      computedVariant = 'success';
    } else if (s === 'partially_paid' || s === 'issued' || s === 'waiting_approval' || s === 'pending') {
      computedVariant = 'warning';
    } else if (s === 'overdue' || s === 'cancelled' || s === 'failed' || s === 'rejected') {
      computedVariant = 'danger';
    } else if (s === 'running') {
      computedVariant = 'ocean';
    } else if (s === 'active') {
      computedVariant = 'brand';
    } else {
      computedVariant = 'outline';
    }
  }

  const variantStyles = {
    default: 'bg-[var(--secondary)] text-[var(--secondary-foreground)] border border-[var(--border)]',
    outline: 'bg-transparent text-[var(--muted-foreground)] border border-[var(--border)]',
    brand: 'bg-[var(--brand-subtle)] text-[var(--brand-from)] border border-[var(--brand-border)] font-semibold',
    ocean: 'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
    violet: 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    danger: 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider',
        variantStyles[computedVariant],
        className
      )}
      {...props}
    >
      {children || status}
    </span>
  );
}

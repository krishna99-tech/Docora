import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: string;
  variant?: 'default' | 'outline' | 'success' | 'warning' | 'danger';
}

export function Badge({ className, status, variant, children, ...props }: BadgeProps) {
  let computedVariant = variant || 'default';

  if (status) {
    const s = status.toLowerCase();
    if (s === 'paid' || s === 'finalized') {
      computedVariant = 'success';
    } else if (s === 'partially_paid' || s === 'issued') {
      computedVariant = 'warning';
    } else if (s === 'overdue' || s === 'cancelled') {
      computedVariant = 'danger';
    } else {
      computedVariant = 'outline';
    }
  }

  const variantStyles = {
    default: 'bg-[var(--secondary)] text-[var(--secondary-foreground)] border border-[var(--border)]',
    outline: 'bg-transparent text-[var(--muted-foreground)] border border-[var(--border)]',
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

'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  Receipt,
  Workflow,
  Search,
  FilterX,
  Users,
  FolderOpen,
  Plus,
  RefreshCw,
  LucideIcon,
  Sparkles,
} from 'lucide-react';

export type EmptyStatePreset =
  | 'documents'
  | 'invoices'
  | 'receipts'
  | 'workflows'
  | 'search'
  | 'filter'
  | 'customers'
  | 'templates'
  | 'generic';

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'outline';
}

export interface EmptyStateProps {
  preset?: EmptyStatePreset;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  searchQuery?: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
  compact?: boolean;
}

const PRESET_CONFIGS: Record<
  EmptyStatePreset,
  {
    icon: LucideIcon;
    title: string;
    description: string;
    gradient: string;
  }
> = {
  documents: {
    icon: FolderOpen,
    title: 'No documents yet',
    description: 'Upload, generate, or organize your PDF receipts and invoices here.',
    gradient: 'from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-cyan-400',
  },
  invoices: {
    icon: FileText,
    title: 'No invoices created',
    description: 'Generate professional multi-currency invoices with automatic tax and line item calculation.',
    gradient: 'from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400',
  },
  receipts: {
    icon: Receipt,
    title: 'No receipts generated',
    description: 'Issue clean, branded payment receipts in PDF format ready to print or email.',
    gradient: 'from-indigo-500/20 to-violet-500/20 text-indigo-600 dark:text-violet-400',
  },
  workflows: {
    icon: Workflow,
    title: 'No workflows configured',
    description: 'Automate document generation, email dispatch, webhook triggers, and multi-step approvals.',
    gradient: 'from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-pink-400',
  },
  search: {
    icon: Search,
    title: 'No matching results',
    description: 'We could not find anything matching your search. Try different keywords or clear filters.',
    gradient: 'from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-orange-400',
  },
  filter: {
    icon: FilterX,
    title: 'No results for selected filters',
    description: 'Try loosening your filter criteria or date range to see matching records.',
    gradient: 'from-rose-500/20 to-amber-500/20 text-rose-600 dark:text-rose-400',
  },
  customers: {
    icon: Users,
    title: 'No customers recorded',
    description: 'Keep track of your clients, billing addresses, and contact details in one place.',
    gradient: 'from-sky-500/20 to-blue-500/20 text-sky-600 dark:text-sky-400',
  },
  templates: {
    icon: Sparkles,
    title: 'No custom templates',
    description: 'Design brand-customized layouts for your invoices, receipts, and reports.',
    gradient: 'from-fuchsia-500/20 to-purple-500/20 text-fuchsia-600 dark:text-fuchsia-400',
  },
  generic: {
    icon: FolderOpen,
    title: 'Nothing here yet',
    description: 'Get started by creating your first record or importing existing data.',
    gradient: 'from-neutral-500/20 to-slate-500/20 text-neutral-600 dark:text-neutral-400',
  },
};

export function EmptyState({
  preset = 'generic',
  icon: CustomIcon,
  title,
  description,
  searchQuery,
  primaryAction,
  secondaryAction,
  className = '',
  compact = false,
}: EmptyStateProps) {
  const config = PRESET_CONFIGS[preset] || PRESET_CONFIGS.generic;
  const IconComponent = CustomIcon || config.icon;
  const displayTitle = searchQuery
    ? `No results for "${searchQuery}"`
    : title || config.title;
  const displayDesc = searchQuery
    ? 'Check your spelling or try searching for another keyword.'
    : description || config.description;

  const renderAction = (action: EmptyStateAction, isPrimary = true) => {
    const ActionIcon = action.icon || (isPrimary ? Plus : RefreshCw);
    const buttonClasses = isPrimary
      ? 'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--brand-from,#0066ff)] hover:opacity-90 text-white shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]'
      : 'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border border-[var(--border,#e5e5e5)] bg-[var(--surface,#ffffff)] hover:bg-[var(--surface-hover,#f1f1f1)] text-[var(--foreground,#111111)] transition-colors';

    if (action.href) {
      return (
        <Link href={action.href} className={buttonClasses}>
          <ActionIcon className="w-3.5 h-3.5" />
          <span>{action.label}</span>
        </Link>
      );
    }

    return (
      <button type="button" onClick={action.onClick} className={buttonClasses}>
        <ActionIcon className="w-3.5 h-3.5" />
        <span>{action.label}</span>
      </button>
    );
  };

  return (
    <div
      className={`flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-[var(--border,#e5e5e5)] bg-[var(--surface-secondary,#fafafa)] transition-all ${
        compact ? 'p-6 sm:p-8' : 'p-10 sm:p-14'
      } ${className}`}
    >
      {/* Icon with gradient badge */}
      <div
        className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br ${config.gradient} border border-black/5 dark:border-white/10 shadow-xs mb-4 ${
          compact ? 'w-12 h-12' : 'w-16 h-16'
        }`}
      >
        <IconComponent className={compact ? 'w-6 h-6' : 'w-8 h-8'} />
      </div>

      {/* Title */}
      <h4
        className={`font-bold text-[var(--foreground,#111111)] tracking-tight ${
          compact ? 'text-base mb-1' : 'text-lg mb-1.5'
        }`}
      >
        {displayTitle}
      </h4>

      {/* Description */}
      <p
        className={`text-[var(--muted-foreground,#737373)] leading-relaxed max-w-sm mb-6 ${
          compact ? 'text-xs' : 'text-sm'
        }`}
      >
        {displayDesc}
      </p>

      {/* Action Buttons */}
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {primaryAction && renderAction(primaryAction, true)}
          {secondaryAction && renderAction(secondaryAction, false)}
        </div>
      )}
    </div>
  );
}

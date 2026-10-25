'use client';

import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { AlertTriangle, Trash2, AlertCircle, HelpCircle, X, Loader2 } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'primary';

export interface ConfirmOptions {
  title?: string;
  message: ReactNode;
  itemName?: string;
  itemType?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return context.confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    setIsLoading(false);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    resolverRef.current?.(true);
    resolverRef.current = null;
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolverRef.current?.(false);
    resolverRef.current = null;
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog
        isOpen={isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        isLoading={isLoading}
        title={options.title || (options.variant === 'danger' ? 'Confirm Deletion' : 'Confirm Action')}
        message={options.message}
        itemName={options.itemName}
        itemType={options.itemType}
        confirmText={options.confirmText || (options.variant === 'danger' ? 'Delete' : 'Confirm')}
        cancelText={options.cancelText || 'Cancel'}
        variant={options.variant || 'danger'}
      />
    </ConfirmContext.Provider>
  );
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message: ReactNode;
  itemName?: string;
  itemType?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  itemName,
  itemType,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading && !localLoading) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, isLoading, localLoading]);

  if (!isOpen) return null;

  const handleAction = async () => {
    try {
      setLocalLoading(true);
      await onConfirm();
    } finally {
      setLocalLoading(false);
    }
  };

  const isBusy = isLoading || localLoading;

  const variantConfig = {
    danger: {
      badgeBg: 'bg-red-500/10 text-red-600 dark:bg-red-950/40 dark:text-red-400 border-red-500/20',
      icon: Trash2,
      confirmVariant: 'danger' as const,
      highlightBorder: 'border-red-500/30',
    },
    warning: {
      badgeBg: 'bg-amber-500/10 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-500/20',
      icon: AlertTriangle,
      confirmVariant: 'default' as const,
      highlightBorder: 'border-amber-500/30',
    },
    info: {
      badgeBg: 'bg-blue-500/10 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-500/20',
      icon: HelpCircle,
      confirmVariant: 'default' as const,
      highlightBorder: 'border-blue-500/30',
    },
    primary: {
      badgeBg: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-500/20',
      icon: AlertCircle,
      confirmVariant: 'default' as const,
      highlightBorder: 'border-indigo-500/30',
    },
  }[variant];

  const Icon = variantConfig.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={isBusy ? undefined : onClose}
    >
      <div
        className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        {/* Close X Button */}
        <button
          onClick={onClose}
          disabled={isBusy}
          className="absolute top-4 right-4 p-1 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-50"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Icon & Title */}
        <div className="flex items-start gap-3.5 pr-6">
          <div
            className={cn(
              'w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-xs',
              variantConfig.badgeBg
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3
              id="confirm-dialog-title"
              className="text-base font-bold text-[var(--foreground)] tracking-tight"
            >
              {title}
            </h3>
            {itemType && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] block mt-0.5">
                {itemType}
              </span>
            )}
          </div>
        </div>

        {/* Message / Description */}
        <div id="confirm-dialog-message" className="text-xs sm:text-sm text-[var(--muted-foreground)] leading-relaxed">
          {message}
        </div>

        {/* Optional Entity Name Card */}
        {itemName && (
          <div className={cn(
            'p-3 rounded-xl border bg-[var(--surface-secondary)] flex items-center justify-between text-xs',
            variantConfig.highlightBorder
          )}>
            <span className="font-mono font-semibold text-[var(--foreground)] truncate max-w-[280px]">
              {itemName}
            </span>
            <span className="text-[10px] text-[var(--muted-foreground)] uppercase font-semibold shrink-0">
              Target
            </span>
          </div>
        )}

        {/* Actions Row */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isBusy}
            className="text-xs font-semibold px-4 h-9"
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={variantConfig.confirmVariant}
            size="sm"
            onClick={handleAction}
            isLoading={isBusy}
            disabled={isBusy}
            className="text-xs font-semibold px-4 h-9 shadow-xs"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

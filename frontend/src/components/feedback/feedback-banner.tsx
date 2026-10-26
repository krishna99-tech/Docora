'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export type FeedbackBannerType = 'success' | 'error' | 'warning' | 'info';
export type FeedbackBannerVariant = 'banner' | 'toast' | 'card';

export interface FeedbackBannerAction {
  label: string;
  onClick: () => void;
  isExternal?: boolean;
}

export interface FeedbackBannerProps {
  type?: FeedbackBannerType;
  title?: string;
  message: React.ReactNode;
  details?: string;
  action?: FeedbackBannerAction;
  onClose?: () => void;
  variant?: FeedbackBannerVariant;
  autoDismissMs?: number;
  className?: string;
  showIcon?: boolean;
  isDismissible?: boolean;
}

const TYPE_CONFIGS = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    border: 'border-emerald-500/30 dark:border-emerald-500/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    textColor: 'text-emerald-950 dark:text-emerald-200',
    progressBar: 'bg-emerald-500',
    defaultTitle: 'Success',
  },
  error: {
    icon: AlertCircle,
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    border: 'border-rose-500/30 dark:border-rose-500/40',
    iconColor: 'text-rose-600 dark:text-rose-400',
    textColor: 'text-rose-950 dark:text-rose-200',
    progressBar: 'bg-rose-500',
    defaultTitle: 'Error',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    border: 'border-amber-500/30 dark:border-amber-500/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
    textColor: 'text-amber-950 dark:text-amber-200',
    progressBar: 'bg-amber-500',
    defaultTitle: 'Attention Needed',
  },
  info: {
    icon: Info,
    bg: 'bg-sky-500/10 dark:bg-sky-500/15',
    border: 'border-sky-500/30 dark:border-sky-500/40',
    iconColor: 'text-sky-600 dark:text-sky-400',
    textColor: 'text-sky-950 dark:text-sky-200',
    progressBar: 'bg-sky-500',
    defaultTitle: 'Note',
  },
};

export function FeedbackBanner({
  type = 'info',
  title,
  message,
  details,
  action,
  onClose,
  variant = 'banner',
  autoDismissMs,
  className = '',
  showIcon = true,
  isDismissible = true,
}: FeedbackBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [progress, setProgress] = useState(100);

  const config = TYPE_CONFIGS[type];
  const Icon = config.icon;

  useEffect(() => {
    if (!autoDismissMs || autoDismissMs <= 0) return;

    const startTime = Date.now();
    const interval = 50;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / autoDismissMs) * 100);
      setProgress(remaining);

      if (elapsed >= autoDismissMs) {
        clearInterval(timer);
        setIsVisible(false);
        onClose?.();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [autoDismissMs, onClose]);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onClose?.();
  };

  // Toast variant: elevated floating box
  if (variant === 'toast') {
    return (
      <div
        role="alert"
        aria-live="polite"
        className={`relative overflow-hidden rounded-xl border shadow-xl backdrop-blur-md p-4 transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${config.bg} ${config.border} ${className}`}
      >
        <div className="flex items-start gap-3">
          {showIcon && (
            <div className={`mt-0.5 shrink-0 ${config.iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div className="flex-1 min-w-0 pr-2">
            {title && (
              <h5 className={`text-sm font-semibold mb-0.5 ${config.textColor}`}>
                {title}
              </h5>
            )}
            <div className={`text-xs leading-relaxed opacity-90 ${config.textColor}`}>
              {message}
            </div>
            {action && (
              <button
                type="button"
                onClick={action.onClick}
                className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity ${config.iconColor}`}
              >
                {action.label}
                {action.isExternal && <ExternalLink className="w-3 h-3" />}
              </button>
            )}
          </div>
          {isDismissible && (
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Close notification"
              className="shrink-0 p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Auto-dismiss progress indicator */}
        {autoDismissMs && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/10 dark:bg-white/10 overflow-hidden">
            <div
              className={`h-full transition-all ease-linear ${config.progressBar}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  // Card or standard Banner variant
  return (
    <div
      role="alert"
      aria-live="polite"
      className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-200 ${
        variant === 'card' ? 'shadow-sm' : ''
      } ${config.bg} ${config.border} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {showIcon && (
            <div className={`mt-0.5 shrink-0 ${config.iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-sm font-semibold ${config.textColor}`}>
                {title || config.defaultTitle}
              </span>
            </div>
            <div className={`text-sm mt-0.5 leading-relaxed opacity-95 ${config.textColor}`}>
              {message}
            </div>

            {/* Expandable Technical Details */}
            {details && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className={`inline-flex items-center gap-1 text-xs font-medium opacity-80 hover:opacity-100 transition-opacity ${config.textColor}`}
                >
                  {showDetails ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" /> Hide details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" /> View technical details
                    </>
                  )}
                </button>
                {showDetails && (
                  <pre className="mt-2 p-2.5 rounded-lg bg-black/5 dark:bg-black/30 text-xs font-mono whitespace-pre-wrap break-all border border-black/10 dark:border-white/10 text-neutral-800 dark:text-neutral-200">
                    {details}
                  </pre>
                )}
              </div>
            )}

            {/* Custom Action Button */}
            {action && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={action.onClick}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/70 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 border border-black/10 dark:border-white/15 shadow-xs transition-all ${config.textColor}`}
                >
                  {action.label}
                  {action.isExternal && <ExternalLink className="w-3 h-3" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dismiss Button */}
        {isDismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss alert"
            className="shrink-0 p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {autoDismissMs && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/10 dark:bg-white/10 overflow-hidden">
          <div
            className={`h-full transition-all ease-linear ${config.progressBar}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
